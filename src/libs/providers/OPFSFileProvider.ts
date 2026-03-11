/**
 * OPFS File Provider — 流式文件存储后端
 *
 * 使用 Origin Private File System (OPFS) 的原生文件 API：
 *   - createWritable()     → 流式写入，无需先缓存为 Blob
 *   - getFile()            → 直接获取 File 对象（免内存拷贝）
 *   - URL.createObjectURL  → 直接生成下载链接
 *
 * 这是 OPFS 的核心优势：可以像操作本地文件一样流式读写，
 * 而不是把所有数据先存到 IndexedDB 再合并。
 */

import {
  normalizeDirectorySegments,
  ensureDirectoryTree,
} from '../storages/FileSystemStorageBase'
import type { IFileProvider, ProviderMeta } from './common'
import { ProviderBase } from './ProviderBase'

export interface OPFSFileProviderOptions {
  /** OPFS 内的根目录名，默认 'offline-recorder' */
  rootDirectory?: string
  /** 命名空间/子目录 */
  namespace?: string | string[]
  /** 是否申请持久存储 */
  ensurePersistentStorage?: boolean
}

export class OPFSFileProvider extends ProviderBase implements IFileProvider {
  readonly kind = 'file' as const
  readonly meta: ProviderMeta = {
    name: 'opfs-file',
    label: 'OPFS 流式文件',
    description: '使用浏览器私有文件系统，支持流式写入和直接文件 URL，适合大文件录音。',
    capabilities: {
      streaming: true,
      directURL: true,
      persistent: true,
      requiresPermission: false,
    },
  }

  private directoryHandle: FileSystemDirectoryHandle | null = null
  private readonly options: OPFSFileProviderOptions

  constructor(options: OPFSFileProviderOptions = {}) {
    super()
    this.options = options
  }

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof (navigator.storage as any)?.getDirectory === 'function'
  }

  async initialize(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('[OPFSFileProvider] 当前浏览器不支持 OPFS')
    }

    if (this.options.ensurePersistentStorage && typeof navigator.storage?.persist === 'function') {
      try {
        await navigator.storage.persist()
      } catch {
        // best effort
      }
    }

    const opfsRoot = await (navigator.storage as any).getDirectory() as FileSystemDirectoryHandle
    const segments = [
      this.options.rootDirectory ?? 'offline-recorder',
      ...normalizeDirectorySegments(this.options.namespace ?? 'files'),
    ]
    this.directoryHandle = await ensureDirectoryTree(opfsRoot, segments)
    this.ready = true
    this.emit({ type: 'ready' })
  }

  async destroy(): Promise<void> {
    this.directoryHandle = null
    await super.destroy()
  }

  private getDir(): FileSystemDirectoryHandle {
    this.ensureReady()
    if (!this.directoryHandle) throw new Error('[OPFSFileProvider] 目录句柄不可用')
    return this.directoryHandle
  }

  /**
   * 创建可写流 — OPFS 核心流式能力
   *
   * 调用方直接向 WritableStream 写入数据，无需先聚合为 Blob。
   * 录音场景：MediaRecorder.ondataavailable → chunk → writer.write(chunk)
   */
  async createWritableStream(filename: string): Promise<WritableStream<Uint8Array>> {
    const dir = this.getDir()
    const handle = await dir.getFileHandle(filename, { create: true })
    const writable = await handle.createWritable({ keepExistingData: false })
    return writable as unknown as WritableStream<Uint8Array>
  }

  /**
   * 追加写入 — 在文件末尾追加数据
   *
   * 适用于录音场景：每秒产生一个 chunk，追加到同一个文件。
   * 最终直接 getFileURL() 即可下载完整录音。
   */
  async appendToFile(filename: string, data: Blob | Uint8Array): Promise<void> {
    const dir = this.getDir()
    const handle = await dir.getFileHandle(filename, { create: true })
    const file = await handle.getFile()
    const writable = await handle.createWritable({ keepExistingData: true }) as any
    await writable.seek(file.size)
    await writable.write(data)
    await writable.close()
  }

  /**
   * 获取文件的直接 URL — 免内存拷贝
   *
   * OPFS 的 getFile() 返回 File 对象（继承 Blob），
   * createObjectURL 不会把文件内容复制到内存，而是创建引用。
   * 浏览器在需要时才从 OPFS 读取数据。
   */
  async getFileURL(filename: string): Promise<string> {
    const dir = this.getDir()
    const handle = await dir.getFileHandle(filename)
    const file = await handle.getFile()
    return URL.createObjectURL(file)
  }

  async getFileBlob(filename: string): Promise<Blob> {
    const dir = this.getDir()
    const handle = await dir.getFileHandle(filename)
    return handle.getFile()
  }

  async getFileSize(filename: string): Promise<number> {
    const dir = this.getDir()
    const handle = await dir.getFileHandle(filename)
    const file = await handle.getFile()
    return file.size
  }

  async listFiles(): Promise<string[]> {
    const dir = this.getDir()
    const names: string[] = []
    for await (const [name, handle] of dir.entries()) {
      if (handle.kind === 'file') {
        names.push(name)
      }
    }
    return names.sort()
  }

  async hasFile(filename: string): Promise<boolean> {
    const dir = this.getDir()
    try {
      await dir.getFileHandle(filename)
      return true
    } catch {
      return false
    }
  }

  async deleteFile(filename: string): Promise<void> {
    const dir = this.getDir()
    try {
      await dir.removeEntry(filename)
    } catch (error) {
      if (await this.hasFile(filename)) throw error
    }
  }

  async clear(): Promise<void> {
    const dir = this.getDir()
    const names = await this.listFiles()
    for (const name of names) {
      await dir.removeEntry(name)
    }
  }

  /** 暴露底层目录句柄，供 HybridProvider 使用 */
  getDirectoryHandle(): FileSystemDirectoryHandle | null {
    return this.directoryHandle
  }
}
