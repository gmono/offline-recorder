/**
 * IndexedDB Queue Provider — 默认的队列存储后端
 *
 * 使用 idb-keyval 存储 Blob chunk，按序号索引。
 * 兼容性最好，零权限，适合作为通用兜底。
 *
 * 不支持流式写入和直接文件 URL，但在所有浏览器上都可用。
 */

import { createStore, get, set, del, clear as idbClear, entries } from 'idb-keyval'
import type { UseStore } from 'idb-keyval'
import type { IQueueProvider, ProviderMeta } from './common'
import { ProviderBase } from './ProviderBase'

export class IndexedDBQueueProvider extends ProviderBase implements IQueueProvider {
  readonly kind = 'queue' as const
  readonly meta: ProviderMeta = {
    name: 'indexeddb-queue',
    label: 'IndexedDB',
    description: '兼容性最好，零权限，适合作为通用兜底存储。',
    capabilities: {
      streaming: false,
      directURL: false,
      persistent: true,
      requiresPermission: false,
    },
  }

  private store: UseStore | null = null
  private chunkCount = 0
  private storageName: string

  constructor(name = 'recording-chunks') {
    super()
    this.storageName = name
  }

  isSupported(): boolean {
    return typeof indexedDB !== 'undefined'
  }

  async initialize(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('[IndexedDBQueueProvider] 当前环境不支持 IndexedDB')
    }
    this.store = createStore(this.storageName, this.storageName)

    // 恢复 chunk 计数
    const allEntries = await entries(this.store)
    this.chunkCount = allEntries.length
    this.ready = true
    this.emit({ type: 'ready' })
  }

  async destroy(): Promise<void> {
    this.store = null
    this.chunkCount = 0
    await super.destroy()
  }

  private ensureStore(): UseStore {
    this.ensureReady()
    if (!this.store) throw new Error('[IndexedDBQueueProvider] store 未初始化')
    return this.store
  }

  async push(chunk: Blob): Promise<void> {
    const store = this.ensureStore()
    const key = String(this.chunkCount)
    await set(key, chunk, store)
    this.chunkCount++
  }

  async getChunk(index: number): Promise<Blob> {
    const store = this.ensureStore()
    const blob = await get<Blob>(String(index), store)
    if (!blob) throw new Error(`[IndexedDBQueueProvider] chunk ${index} 不存在`)
    return blob
  }

  async count(): Promise<number> {
    return this.chunkCount
  }

  async getAllChunks(): Promise<Blob[]> {
    const store = this.ensureStore()
    const all = await entries(store)
    return all
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, blob]) => blob as Blob)
  }

  async getBlob(mimeType = 'audio/webm'): Promise<Blob> {
    const chunks = await this.getAllChunks()
    return new Blob(chunks, { type: mimeType })
  }

  async getMediaURL(mimeType = 'audio/webm'): Promise<string> {
    const mediaSource = new MediaSource()

    const url = URL.createObjectURL(mediaSource)

    mediaSource.addEventListener('sourceopen', async () => {
      const sourceBuffer = mediaSource.addSourceBuffer(mimeType)
      const total = this.chunkCount

      for (let i = 0; i < total; i++) {
        const chunk = await this.getChunk(i)
        sourceBuffer.appendBuffer(await chunk.arrayBuffer())

        if (sourceBuffer.updating) {
          await new Promise<void>((resolve) => {
            const handler = () => {
              sourceBuffer.removeEventListener('updateend', handler)
              resolve()
            }
            sourceBuffer.addEventListener('updateend', handler)
          })
        }
      }

      if (mediaSource.readyState === 'open') {
        mediaSource.endOfStream()
      }
    })

    return url
  }

  async clear(): Promise<void> {
    const store = this.ensureStore()
    await idbClear(store)
    this.chunkCount = 0
  }
}
