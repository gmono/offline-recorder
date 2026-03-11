import { FileSystemStorageBase, ensureDirectoryTree, normalizeDirectorySegments } from './FileSystemStorageBase'

export interface OPFSStorageOptions {
  rootDirectory?: string
  namespace?: string | string[]
  ensurePersistentStorage?: boolean
}

export class OPFSStorage extends FileSystemStorageBase {
  constructor(options: OPFSStorageOptions = {}) {
    super(async () => {
      const root = await OPFSStorage.getRootDirectory(options.ensurePersistentStorage ?? false)
      const segments = [options.rootDirectory ?? 'offline-recorder', ...normalizeDirectorySegments(options.namespace ?? 'default')]
      return ensureDirectoryTree(root, segments)
    })
  }

  static isSupported() {
    return typeof navigator !== 'undefined' && typeof (navigator.storage as any)?.getDirectory === 'function'
  }

  static async getRootDirectory(requestPersistence = false): Promise<FileSystemDirectoryHandle> {
    if (!OPFSStorage.isSupported()) {
      throw new Error('当前浏览器不支持 OPFS')
    }

    if (requestPersistence && typeof navigator.storage?.persist === 'function') {
      try {
        await navigator.storage.persist()
      } catch {
        // ignore persistence failures and continue with best effort
      }
    }

    return (navigator.storage as any).getDirectory()
  }
}
