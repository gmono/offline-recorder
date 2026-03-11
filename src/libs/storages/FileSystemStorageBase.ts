import { createStore, del, get, set } from 'idb-keyval'

import { IStorage } from '../commom'

const BLOCK_FILE_PREFIX = 'block-'
const BLOCK_FILE_SUFFIX = '.blob'
const DIRECTORY_HANDLE_STORE = createStore('offline-recorder-fs-access', 'directory-handles')

function encodeBlockFileName(id: string) {
  return `${BLOCK_FILE_PREFIX}${encodeURIComponent(id)}${BLOCK_FILE_SUFFIX}`
}

function decodeBlockFileName(fileName: string): string | null {
  if (!fileName.startsWith(BLOCK_FILE_PREFIX) || !fileName.endsWith(BLOCK_FILE_SUFFIX)) {
    return null
  }

  return decodeURIComponent(fileName.slice(BLOCK_FILE_PREFIX.length, -BLOCK_FILE_SUFFIX.length))
}

function compareBlockIds(left: string, right: string) {
  const leftNumber = Number(left)
  const rightNumber = Number(right)

  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
    return leftNumber - rightNumber
  }

  return left.localeCompare(right)
}

export function normalizeDirectorySegments(input?: string | string[]): string[] {
  if (!input) {
    return []
  }

  return (Array.isArray(input) ? input : [input])
    .map((segment) => segment.trim())
    .filter(Boolean)
}

export async function ensureDirectoryTree(
  root: FileSystemDirectoryHandle,
  segments: string[],
): Promise<FileSystemDirectoryHandle> {
  let current = root

  for (const segment of segments) {
    current = await current.getDirectoryHandle(segment, { create: true })
  }

  return current
}

export async function ensureHandlePermission(
  handle: FileSystemHandle,
  mode: FileSystemHandlePermissionMode = 'readwrite',
): Promise<boolean> {
  if (!handle.queryPermission || !handle.requestPermission) {
    return true
  }

  const descriptor = { mode }
  const current = await handle.queryPermission(descriptor)
  if (current === 'granted') {
    return true
  }

  return (await handle.requestPermission(descriptor)) === 'granted'
}

export async function rememberDirectoryHandle(key: string, handle: FileSystemDirectoryHandle): Promise<void> {
  await set(key, handle, DIRECTORY_HANDLE_STORE)
}

export async function restoreDirectoryHandle(key: string): Promise<FileSystemDirectoryHandle | null> {
  const handle = await get<FileSystemDirectoryHandle | undefined>(key, DIRECTORY_HANDLE_STORE)
  return handle ?? null
}

export async function forgetDirectoryHandle(key: string): Promise<void> {
  await del(key, DIRECTORY_HANDLE_STORE)
}

async function writeBlobToHandle(fileHandle: FileSystemFileHandle, blob: Blob): Promise<void> {
  const writer = await fileHandle.createWritable({ keepExistingData: false })
  await writer.write(blob)
  await writer.close()
}

export abstract class FileSystemStorageBase implements IStorage {
  protected constructor(private readonly directoryProvider: () => Promise<FileSystemDirectoryHandle>) {}

  protected async getDirectoryHandle() {
    return this.directoryProvider()
  }

  protected fileNameFor(id: string) {
    return encodeBlockFileName(id)
  }

  protected async listBlockEntries() {
    const directory = await this.getDirectoryHandle()
    const entries: Array<{ id: string; name: string; handle: FileSystemFileHandle }> = []

    for await (const [name, handle] of directory.entries()) {
      if (handle.kind !== 'file') {
        continue
      }

      const id = decodeBlockFileName(name)
      if (id == null) {
        continue
      }

      entries.push({ id, name, handle: handle as FileSystemFileHandle })
    }

    entries.sort((left, right) => compareBlockIds(left.id, right.id))
    return entries
  }

  async pushBlock(id: string, blob: Blob): Promise<void> {
    const directory = await this.getDirectoryHandle()
    const handle = await directory.getFileHandle(this.fileNameFor(id), { create: true })
    await writeBlobToHandle(handle, blob)
  }

  async updateBlock(id: string, blob: Blob): Promise<void> {
    await this.pushBlock(id, blob)
  }

  async removeBlock(id: string): Promise<void> {
    const directory = await this.getDirectoryHandle()
    try {
      await directory.removeEntry(this.fileNameFor(id))
    } catch (error) {
      if (await this.hasBlock(id)) {
        throw error
      }
    }
  }

  async hasBlock(id: string): Promise<boolean> {
    const directory = await this.getDirectoryHandle()
    try {
      await directory.getFileHandle(this.fileNameFor(id))
      return true
    } catch {
      return false
    }
  }

  async getBlock(id: string): Promise<Blob> {
    const directory = await this.getDirectoryHandle()
    const handle = await directory.getFileHandle(this.fileNameFor(id))
    return handle.getFile()
  }

  async clear(): Promise<void> {
    const directory = await this.getDirectoryHandle()
    const entries = await this.listBlockEntries()

    for (const entry of entries) {
      await directory.removeEntry(entry.name)
    }
  }

  async count(): Promise<number> {
    return (await this.listBlockEntries()).length
  }

  async entities(): Promise<[string, Blob][]> {
    const entries = await this.listBlockEntries()
    return Promise.all(
      entries.map(async (entry) => [entry.id, await entry.handle.getFile()] as [string, Blob]),
    )
  }
}
