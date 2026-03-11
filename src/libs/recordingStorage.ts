import { PackedSequenceBucket } from './buckets/PackedFIFOBucket'
import { IBucket, IStorage } from './commom'
import { PackedStorageSequence } from './sequences/PackedStorageSequence'
import { DirectoryAccessStorage } from './storages/DirectoryAccessStorage'
import { IndexedDBStorage } from './storages/IndexedDBStorage'
import { OPFSStorage } from './storages/OPFSStorage'
import { RAIDStorage } from './storages/RAIDStorage'

export type RecordingStorageBackendKind =
  | 'indexeddb'
  | 'opfs'
  | 'directory-access'
  | 'hybrid-opfs-indexeddb'
  | 'hybrid-directory-indexeddb'

export interface RecordingStorageFactoryOptions {
  name?: string
  namespace?: string | string[]
  rootDirectory?: string
  directoryHandle?: FileSystemDirectoryHandle
  directoryHandleKey?: string
  subdirectories?: string | string[]
  ensurePersistentStorage?: boolean
}

export async function createRecordingStorage(
  kind: RecordingStorageBackendKind,
  options: RecordingStorageFactoryOptions = {},
): Promise<IStorage> {
  const bucketName = options.name ?? 'recording-blocks'

  const resolveDirectoryStorage = async () => {
    if (options.directoryHandle) {
      return new DirectoryAccessStorage({
        directoryHandle: options.directoryHandle,
        subdirectories: options.subdirectories ?? bucketName,
      })
    }

    if (options.directoryHandleKey) {
      const restored = await DirectoryAccessStorage.restore(options.directoryHandleKey, {
        subdirectories: options.subdirectories ?? bucketName,
      })
      if (restored) {
        return restored
      }
    }

    throw new Error('directory-access 后端需要提供 directoryHandle 或 directoryHandleKey')
  }

  switch (kind) {
    case 'indexeddb':
      return new IndexedDBStorage(bucketName)
    case 'opfs':
      return new OPFSStorage({
        rootDirectory: options.rootDirectory,
        namespace: options.namespace ?? bucketName,
        ensurePersistentStorage: options.ensurePersistentStorage,
      })
    case 'directory-access': {
      return resolveDirectoryStorage()
    }
    case 'hybrid-opfs-indexeddb':
      return new RAIDStorage([
        new OPFSStorage({
          rootDirectory: options.rootDirectory,
          namespace: options.namespace ?? bucketName,
          ensurePersistentStorage: options.ensurePersistentStorage,
        }),
        new IndexedDBStorage(bucketName),
      ])
    case 'hybrid-directory-indexeddb': {
      const directoryStorage = await resolveDirectoryStorage()

      return new RAIDStorage([
        directoryStorage,
        new IndexedDBStorage(bucketName),
      ])
    }
    default:
      throw new Error(`未知的录音存储后端：${kind}`)
  }
}

export async function createRecordingBucket(
  kind: RecordingStorageBackendKind,
  options: RecordingStorageFactoryOptions = {},
  mimeType = 'audio/webm',
): Promise<IBucket> {
  const storage = await createRecordingStorage(kind, options)
  return new PackedSequenceBucket(new PackedStorageSequence(storage), mimeType)
}
