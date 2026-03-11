/**
 * Directory Hybrid Provider — 本地目录的混合后端
 *
 * 与 OPFSHybridProvider 结构一致，但底层使用 DirectoryFileProvider。
 * 队列功能通过文件命名约定实现 (__q_XXXXXXXX.blob)。
 */

import type { IHybridProvider, IQueueProvider, IFileProvider, ProviderMeta } from './common'
import { ProviderBase } from './ProviderBase'
import { DirectoryFileProvider } from './DirectoryFileProvider'
import type { DirectoryFileProviderOptions } from './DirectoryFileProvider'

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

class DirectoryQueueView extends ProviderBase implements IQueueProvider {
  readonly kind = 'queue' as const
  readonly meta: ProviderMeta

  private fileProvider: DirectoryFileProvider
  private nextIndex = 0

  constructor(fileProvider: DirectoryFileProvider) {
    super()
    this.fileProvider = fileProvider
    this.meta = {
      name: 'directory-queue-view',
      label: '本地目录队列视图',
      description: '通过本地目录文件系统实现的队列功能',
      capabilities: fileProvider.meta.capabilities,
    }
  }

  isSupported(): boolean {
    return this.fileProvider.isSupported()
  }

  async initialize(): Promise<void> {
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

export class DirectoryHybridProvider extends ProviderBase implements IHybridProvider {
  readonly kind = 'hybrid' as const
  readonly meta: ProviderMeta = {
    name: 'directory-hybrid',
    label: '本地目录混合',
    description: '将录音写入用户选择的本地目录，同时支持队列和文件操作。',
    capabilities: {
      streaming: true,
      directURL: true,
      persistent: true,
      requiresPermission: true,
    },
  }

  private fileProvider: DirectoryFileProvider
  private queueView: DirectoryQueueView

  constructor(options: DirectoryFileProviderOptions = {}) {
    super()
    this.fileProvider = new DirectoryFileProvider(options)
    this.queueView = new DirectoryQueueView(this.fileProvider)
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
    const files = await this.fileProvider.listFiles()
    for (const f of files) {
      await this.fileProvider.deleteFile(f)
    }
  }

  /** 绑定新目录 */
  async rebindDirectory(handle: FileSystemDirectoryHandle): Promise<void> {
    await this.fileProvider.rebindDirectory(handle)
    await this.queueView.initialize()
  }

  /** 获取底层 FileProvider */
  getFileProvider(): DirectoryFileProvider {
    return this.fileProvider
  }
}
