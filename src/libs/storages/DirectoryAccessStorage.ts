import {
  FileSystemStorageBase,
  ensureDirectoryTree,
  ensureHandlePermission,
  forgetDirectoryHandle,
  normalizeDirectorySegments,
  rememberDirectoryHandle,
  restoreDirectoryHandle,
} from './FileSystemStorageBase'

export interface DirectoryAccessStorageOptions {
  directoryHandle: FileSystemDirectoryHandle
  subdirectories?: string | string[]
  handleKey?: string
  requestPermission?: boolean
}

export interface RequestDirectoryAccessOptions {
  id?: string
  mode?: FileSystemHandlePermissionMode
  startIn?: string | FileSystemDirectoryHandle
  subdirectories?: string | string[]
  rememberKey?: string
}

export interface RestoreDirectoryAccessOptions {
  subdirectories?: string | string[]
  requestPermission?: boolean
}

export class DirectoryAccessStorage extends FileSystemStorageBase {
  private readonly directoryHandle: FileSystemDirectoryHandle

  constructor(private readonly options: DirectoryAccessStorageOptions) {
    super(async () => {
      if (options.requestPermission !== false) {
        const granted = await ensureHandlePermission(options.directoryHandle, 'readwrite')
        if (!granted) {
          throw new Error('没有获得本地目录的读写权限')
        }
      }

      return ensureDirectoryTree(options.directoryHandle, normalizeDirectorySegments(options.subdirectories))
    })

    this.directoryHandle = options.directoryHandle
  }

  static isSupported() {
    return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
  }

  static async request(options: RequestDirectoryAccessOptions = {}) {
    if (!DirectoryAccessStorage.isSupported()) {
      throw new Error('当前浏览器不支持 File System Access API')
    }

    const handle = await window.showDirectoryPicker?.({
      id: options.id,
      mode: options.mode ?? 'readwrite',
      startIn: options.startIn,
    })

    if (!handle) {
      throw new Error('目录选择已取消')
    }

    const storage = new DirectoryAccessStorage({
      directoryHandle: handle,
      subdirectories: options.subdirectories,
      handleKey: options.rememberKey,
    })

    if (options.rememberKey) {
      await storage.rememberHandle(options.rememberKey)
    }

    return storage
  }

  static async restore(key: string, options: RestoreDirectoryAccessOptions = {}) {
    const handle = await restoreDirectoryHandle(key)
    if (!handle) {
      return null
    }

    if (options.requestPermission !== false) {
      const granted = await ensureHandlePermission(handle, 'readwrite')
      if (!granted) {
        return null
      }
    }

    return new DirectoryAccessStorage({
      directoryHandle: handle,
      subdirectories: options.subdirectories,
      handleKey: key,
      requestPermission: false,
    })
  }

  async rememberHandle(key = this.options.handleKey) {
    if (!key) {
      throw new Error('rememberHandle 需要传入 handleKey')
    }

    await rememberDirectoryHandle(key, this.directoryHandle)
  }

  async forgetHandle(key = this.options.handleKey) {
    if (!key) {
      return
    }

    await forgetDirectoryHandle(key)
  }

  async ensureReadWritePermission() {
    return ensureHandlePermission(this.directoryHandle, 'readwrite')
  }

  get rootHandle() {
    return this.directoryHandle
  }
}
