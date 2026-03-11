/**
 * Directory File Provider — 本地目录流式文件后端
 *
 * 使用 File System Access API（showDirectoryPicker）让用户选择本地目录，
 * 然后通过 createWritable() 流式写入文件。
 *
 * 优势：
 *   - 录音数据直接写入用户选定的目录
 *   - 用户可以用文件管理器直接查看/管理录音文件
 *   - 支持流式写入，不占用 JS 堆内存
 *
 * 限制：
 *   - 需要用户手动授权
 *   - 不是所有浏览器都支持（Chrome/Edge OK，Firefox/Safari 不支持）
 */

import {
  ensureHandlePermission,
  rememberDirectoryHandle,
  restoreDirectoryHandle,
  forgetDirectoryHandle,
  normalizeDirectorySegments,
  ensureDirectoryTree,
} from '../storages/FileSystemStorageBase'
import type { IFileProvider, ProviderMeta } from './common'
import { ProviderBase } from './ProviderBase'

export interface DirectoryFileProviderOptions {
  /** 子目录 (在用户选定目录下创建) */
  subdirectory?: string | string[]
  /** 已有的目录句柄（直接使用，不弹窗） */
  directoryHandle?: FileSystemDirectoryHandle
  /** idb-keyval 中记忆句柄的 key（用于刷新后恢复） */
  handleKey?: string
}

export class DirectoryFileProvider extends ProviderBase implements IFileProvider {
  readonly kind = 'file' as const
  readonly meta: ProviderMeta = {
    name: 'directory-file',
    label: '本地目录',
    description: '将录音文件直接写入用户选择的本地文件夹，可用文件管理器直接查看。',
    capabilities: {
      streaming: true,
      directURL: true,
      persistent: true,
      requiresPermission: true,
    },
  }

  private directoryHandle: FileSystemDirectoryHandle | null = null
  private readonly options: DirectoryFileProviderOptions
  private granted = false

  constructor(options: DirectoryFileProviderOptions = {}) {
    super()
    this.options = options
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' && typeof (window as any).showDirectoryPicker === 'function'
  }

  isSupported(): boolean {
    return DirectoryFileProvider.isSupported()
  }

  /**
   * 静态方法 — 弹窗让用户选择目录并返回 provider
   */
  static async requestDirectory(options: DirectoryFileProviderOptions = {}): Promise<DirectoryFileProvider> {
    const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' })
    const provider = new DirectoryFileProvider({ ...options, directoryHandle: handle })
    return provider
  }

  /**
   * 从 idb-keyval 恢复之前的目录句柄
   */
  static async restoreDirectory(handleKey: string, options: DirectoryFileProviderOptions = {}): Promise<DirectoryFileProvider | null> {
    const handle = await restoreDirectoryHandle(handleKey)
    if (!handle) return null

    const ok = await ensureHandlePermission(handle, 'readwrite')
    if (!ok) return null

    return new DirectoryFileProvider({ ...options, directoryHandle: handle, handleKey })
  }

  async initialize(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('[DirectoryFileProvider] 当前浏览器不支持 File System Access API')
    }

    // 优先使用已有句柄
    let rootHandle = this.options.directoryHandle ?? null

    // 尝试从 idb 恢复
    if (!rootHandle && this.options.handleKey) {
      rootHandle = await restoreDirectoryHandle(this.options.handleKey)
    }

    if (!rootHandle) {
      throw new Error('[DirectoryFileProvider] 没有可用的目录句柄，请先调用 requestDirectory() 或提供 directoryHandle')
    }

    // 确保权限
    this.granted = await ensureHandlePermission(rootHandle, 'readwrite')
    if (!this.granted) {
      throw new Error('[DirectoryFileProvider] 用户拒绝了文件系统权限')
    }

    // 进入子目录
    const subdirs = normalizeDirectorySegments(this.options.subdirectory ?? 'recordings')
    this.directoryHandle = await ensureDirectoryTree(rootHandle, subdirs)

    // 记忆句柄
    if (this.options.handleKey) {
      await rememberDirectoryHandle(this.options.handleKey, rootHandle)
    }

    this.ready = true
    this.emit({ type: 'ready' })
  }

  async destroy(): Promise<void> {
    this.directoryHandle = null
    this.granted = false
    await super.destroy()
  }

  /**
   * 清除记忆的目录句柄
   */
  async forgetHandle(): Promise<void> {
    if (this.options.handleKey) {
      await forgetDirectoryHandle(this.options.handleKey)
    }
  }

  /**
   * 绑定新目录（只更新句柄而不重新初始化整个 provider）
   */
  async rebindDirectory(handle: FileSystemDirectoryHandle): Promise<void> {
    const ok = await ensureHandlePermission(handle, 'readwrite')
    if (!ok) throw new Error('[DirectoryFileProvider] 权限被拒绝')

    const subdirs = normalizeDirectorySegments(this.options.subdirectory ?? 'recordings')
    this.directoryHandle = await ensureDirectoryTree(handle, subdirs)

    if (this.options.handleKey) {
      await rememberDirectoryHandle(this.options.handleKey, handle)
    }

    this.granted = true
    if (!this.ready) {
      this.ready = true
      this.emit({ type: 'ready' })
    }
  }

  private getDir(): FileSystemDirectoryHandle {
    this.ensureReady()
    if (!this.directoryHandle) throw new Error('[DirectoryFileProvider] 目录句柄不可用')
    return this.directoryHandle
  }

  async createWritableStream(filename: string): Promise<WritableStream<Uint8Array>> {
    const dir = this.getDir()
    const handle = await dir.getFileHandle(filename, { create: true })
    const writable = await handle.createWritable({ keepExistingData: false })
    return writable as unknown as WritableStream<Uint8Array>
  }

  async appendToFile(filename: string, data: Blob | Uint8Array): Promise<void> {
    const dir = this.getDir()
    const handle = await dir.getFileHandle(filename, { create: true })
    const file = await handle.getFile()
    const writable = await handle.createWritable({ keepExistingData: true }) as any
    await writable.seek(file.size)
    await writable.write(data)
    await writable.close()
  }

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

  /** 暴露底层目录句柄 */
  getDirectoryHandle(): FileSystemDirectoryHandle | null {
    return this.directoryHandle
  }

  /** 是否已获得读写权限 */
  isGranted(): boolean {
    return this.granted
  }
}
