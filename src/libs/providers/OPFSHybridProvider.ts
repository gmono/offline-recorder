/**
 * OPFS Hybrid Provider — 同时提供队列+文件能力的 OPFS 后端
 *
 * 队列模式：每个 chunk 存为独立文件 (chunk-000000.blob, chunk-000001.blob …)
 * 文件模式：直接使用 OPFSFileProvider 读写任意文件
 *
 * 两种模式共享同一个 OPFS 目录，互不干扰。
 */

import type { IHybridProvider, IQueueProvider, IFileProvider, ProviderMeta } from './common'
import { ProviderBase } from './ProviderBase'
import { OPFSFileProvider } from './OPFSFileProvider'
import type { OPFSFileProviderOptions } from './OPFSFileProvider'

const QUEUE_PREFIX = '__q_'

function chunkKey(index: number): string {
  return `${QUEUE_PREFIX}${String(index).padStart(8, '0')}.blob`
}

function isQueueFile(name: string): boolean {
  return name.startsWith(QUEUE_PREFIX)
}

function queueIndex(name: string): number {
  return parseInt(name.slice(QUEUE_PREFIX.length, -5), 10)
}

/**
 * 队列视图 — 内部类，由 OPFSHybridProvider 创建
 */
class OPFSQueueView extends ProviderBase implements IQueueProvider {
  readonly kind = 'queue' as const
  readonly meta: ProviderMeta

  private fileProvider: OPFSFileProvider
  private nextIndex = 0

  constructor(fileProvider: OPFSFileProvider) {
    super()
    this.fileProvider = fileProvider
    this.meta = {
      name: 'opfs-queue-view',
      label: 'OPFS 队列视图',
      description: '通过 OPFS 文件系统实现的队列功能',
      capabilities: fileProvider.meta.capabilities,
    }
  }

  isSupported(): boolean {
    return this.fileProvider.isSupported()
  }

  async initialize(): Promise<void> {
    // 恢复 chunk 计数
    const files = await this.fileProvider.listFiles()
    const queueFiles = files.filter(isQueueFile)

    if (queueFiles.length > 0) {
      this.nextIndex = Math.max(...queueFiles.map(queueIndex)) + 1
    } else {
      this.nextIndex = 0
    }

    this.ready = true
  }

  async push(chunk: Blob): Promise<void> {
    const key = chunkKey(this.nextIndex)
    await this.fileProvider.appendToFile(key, chunk)
    this.nextIndex++
  }

  async getChunk(index: number): Promise<Blob> {
    return this.fileProvider.getFileBlob(chunkKey(index))
  }

  async count(): Promise<number> {
    const files = await this.fileProvider.listFiles()
    return files.filter(isQueueFile).length
  }

  async getAllChunks(): Promise<Blob[]> {
    const files = (await this.fileProvider.listFiles()).filter(isQueueFile).sort()
    const chunks: Blob[] = []
    for (const f of files) {
      chunks.push(await this.fileProvider.getFileBlob(f))
    }
    return chunks
  }

  async getBlob(mimeType = 'audio/webm'): Promise<Blob> {
    const chunks = await this.getAllChunks()
    return new Blob(chunks, { type: mimeType })
  }

  async getMediaURL(mimeType = 'audio/webm'): Promise<string> {
    const blob = await this.getBlob(mimeType)
    return URL.createObjectURL(blob)
  }

  async clear(): Promise<void> {
    const files = (await this.fileProvider.listFiles()).filter(isQueueFile)
    for (const f of files) {
      await this.fileProvider.deleteFile(f)
    }
    this.nextIndex = 0
  }
}

export class OPFSHybridProvider extends ProviderBase implements IHybridProvider {
  readonly kind = 'hybrid' as const
  readonly meta: ProviderMeta = {
    name: 'opfs-hybrid',
    label: 'OPFS 混合',
    description: '同时提供文件流式写入和队列功能，适合录音+文件管理场景。',
    capabilities: {
      streaming: true,
      directURL: true,
      persistent: true,
      requiresPermission: false,
    },
  }

  private fileProvider: OPFSFileProvider
  private queueView: OPFSQueueView

  constructor(options: OPFSFileProviderOptions = {}) {
    super()
    this.fileProvider = new OPFSFileProvider(options)
    this.queueView = new OPFSQueueView(this.fileProvider)
  }

  isSupported(): boolean {
    return this.fileProvider.isSupported()
  }

  async initialize(): Promise<void> {
    await this.fileProvider.initialize()
    await this.queueView.initialize()
    this.ready = true
    this.emit({ type: 'ready' })
  }

  async destroy(): Promise<void> {
    await this.queueView.destroy()
    await this.fileProvider.destroy()
    await super.destroy()
  }

  asQueue(): IQueueProvider {
    return this.queueView
  }

  asFile(): IFileProvider {
    return this.fileProvider
  }

  // ─ 队列快捷方式 ─
  push(chunk: Blob) { return this.queueView.push(chunk) }
  getChunk(index: number) { return this.queueView.getChunk(index) }
  count() { return this.queueView.count() }
  getBlob(mimeType?: string) { return this.queueView.getBlob(mimeType) }
  getMediaURL(mimeType?: string) { return this.queueView.getMediaURL(mimeType) }

  // ─ 文件快捷方式 ─
  createWritableStream(filename: string) { return this.fileProvider.createWritableStream(filename) }
  appendToFile(filename: string, data: Blob | Uint8Array) { return this.fileProvider.appendToFile(filename, data) }
  getFileURL(filename: string) { return this.fileProvider.getFileURL(filename) }
  getFileBlob(filename: string) { return this.fileProvider.getFileBlob(filename) }
  listFiles() { return this.fileProvider.listFiles() }
  deleteFile(filename: string) { return this.fileProvider.deleteFile(filename) }

  async clear(): Promise<void> {
    await this.queueView.clear()
    // 也清空非队列文件
    const files = await this.fileProvider.listFiles()
    for (const f of files) {
      await this.fileProvider.deleteFile(f)
    }
  }
}
