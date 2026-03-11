import type { IFileProvider, IHybridProvider, IQueueProvider, ProviderMeta } from './common'
import { ProviderBase } from './ProviderBase'
import { buildCloudAuthedUrl, cloudMe, cloudRequest, getCloudApiBaseUrl, getCloudToken } from '@/libs/cloud/api'

export interface CloudHybridProviderOptions {
  name?: string
  namespace?: string | string[]
  baseUrl?: string
}

function normalizeNamespace(options: CloudHybridProviderOptions = {}) {
  const parts: string[] = []
  if (Array.isArray(options.namespace)) {
    parts.push(...options.namespace)
  } else if (options.namespace) {
    parts.push(options.namespace)
  }
  if (options.name) {
    parts.unshift(options.name)
  }
  return parts.filter(Boolean).join('/') || 'default'
}

function toBlob(data: Blob | Uint8Array) {
  if (data instanceof Blob) {
    return data
  }
  const bytes = new Uint8Array(data.byteLength)
  bytes.set(data)
  return new Blob([bytes.buffer])
}

class CloudFileView extends ProviderBase implements IFileProvider {
  readonly kind = 'file' as const
  readonly meta: ProviderMeta = {
    name: 'cloud-file',
    label: '云文件系统',
    description: '文件直接写入 Rust 云后端，可跨设备同步历史录音。',
    capabilities: {
      streaming: true,
      directURL: true,
      persistent: true,
      requiresPermission: false,
    },
  }

  constructor(private namespace: string, private baseUrl: string) {
    super()
  }

  isSupported() {
    return typeof fetch !== 'undefined' && Boolean(getCloudToken())
  }

  async initialize() {
    if (!this.isSupported()) {
      throw new Error('[cloud-file] 当前未登录云账号')
    }
    await cloudMe()
    this.ready = true
    this.emit({ type: 'ready' })
  }

  async createWritableStream(filename: string): Promise<WritableStream<Uint8Array>> {
    this.ensureReady()
    const self = this
    return new WritableStream<Uint8Array>({
      async write(chunk) {
        await self.appendToFile(filename, chunk)
      },
    })
  }

  async appendToFile(filename: string, data: Blob | Uint8Array) {
    this.ensureReady()
    await cloudRequest('/api/v1/cloud/files/append', {
      method: 'POST',
      auth: true,
      query: {
        namespace: this.namespace,
        filename,
      },
      body: toBlob(data),
    })
  }

  async getFileURL(filename: string) {
    this.ensureReady()
    return buildCloudAuthedUrl('/api/v1/cloud/files/blob', {
      namespace: this.namespace,
      filename,
    }).replace(getCloudApiBaseUrl(), this.baseUrl)
  }

  async getFileBlob(filename: string) {
    this.ensureReady()
    return await cloudRequest<Blob>('/api/v1/cloud/files/blob', {
      method: 'GET',
      auth: true,
      responseType: 'blob',
      query: {
        namespace: this.namespace,
        filename,
      },
    })
  }

  async getFileSize(filename: string) {
    const meta = await this.getFileMeta(filename)
    return meta ? meta.size : 0
  }

  async listFiles() {
    this.ensureReady()
    const data = await cloudRequest<{ items: Array<{ name: string }> }>('/api/v1/cloud/files/list', {
      method: 'GET',
      auth: true,
      query: {
        namespace: this.namespace,
      },
    })
    return (data.items || []).map((item) => item.name)
  }

  async hasFile(filename: string) {
    const meta = await this.getFileMeta(filename)
    return Boolean(meta)
  }

  async deleteFile(filename: string) {
    this.ensureReady()
    await cloudRequest('/api/v1/cloud/files/delete', {
      method: 'DELETE',
      auth: true,
      query: {
        namespace: this.namespace,
        filename,
      },
    })
  }

  async clear() {
    this.ensureReady()
    await cloudRequest('/api/v1/cloud/files/clear', {
      method: 'DELETE',
      auth: true,
      query: {
        namespace: this.namespace,
      },
    })
  }

  private async getFileMeta(filename: string) {
    try {
      const data = await cloudRequest<{ file: { name: string, size: number, updated_at: number } }>('/api/v1/cloud/files/meta', {
        method: 'GET',
        auth: true,
        query: {
          namespace: this.namespace,
          filename,
        },
      })
      return data.file
    } catch (error) {
      return null
    }
  }
}

class CloudQueueView extends ProviderBase implements IQueueProvider {
  readonly kind = 'queue' as const
  readonly meta: ProviderMeta = {
    name: 'cloud-queue',
    label: '云队列',
    description: '录制 chunk 实时写入 Rust 云队列。',
    capabilities: {
      streaming: true,
      directURL: false,
      persistent: true,
      requiresPermission: false,
    },
  }

  constructor(private namespace: string) {
    super()
  }

  isSupported() {
    return typeof fetch !== 'undefined' && Boolean(getCloudToken())
  }

  async initialize() {
    if (!this.isSupported()) {
      throw new Error('[cloud-queue] 当前未登录云账号')
    }
    await cloudMe()
    this.ready = true
    this.emit({ type: 'ready' })
  }

  async push(chunk: Blob) {
    this.ensureReady()
    await cloudRequest('/api/v1/cloud/queue/push', {
      method: 'POST',
      auth: true,
      query: {
        namespace: this.namespace,
      },
      body: chunk,
    })
  }

  async getChunk(index: number) {
    this.ensureReady()
    return await cloudRequest<Blob>('/api/v1/cloud/queue/chunk', {
      method: 'GET',
      auth: true,
      responseType: 'blob',
      query: {
        namespace: this.namespace,
        index,
      },
    })
  }

  async count() {
    this.ensureReady()
    const data = await cloudRequest<{ count: number }>('/api/v1/cloud/queue/count', {
      method: 'GET',
      auth: true,
      query: {
        namespace: this.namespace,
      },
    })
    return data.count || 0
  }

  async getAllChunks() {
    const total = await this.count()
    const chunks: Blob[] = []
    for (let index = 0; index < total; index += 1) {
      chunks.push(await this.getChunk(index))
    }
    return chunks
  }

  async getBlob(mimeType = 'audio/webm') {
    const chunks = await this.getAllChunks()
    return new Blob(chunks, { type: mimeType })
  }

  async getMediaURL(mimeType = 'audio/webm') {
    const blob = await this.getBlob(mimeType)
    return URL.createObjectURL(blob)
  }

  async clear() {
    this.ensureReady()
    await cloudRequest('/api/v1/cloud/queue/clear', {
      method: 'DELETE',
      auth: true,
      query: {
        namespace: this.namespace,
      },
    })
  }
}

export class CloudHybridProvider extends ProviderBase implements IHybridProvider {
  readonly kind = 'hybrid' as const
  readonly meta: ProviderMeta = {
    name: 'cloud-hybrid',
    label: '云提供者',
    description: '登录后把临时队列与历史文件同步到 Rust 云后端。',
    capabilities: {
      streaming: true,
      directURL: true,
      persistent: true,
      requiresPermission: false,
    },
  }

  private readonly fileView: CloudFileView
  private readonly queueView: CloudQueueView

  constructor(options: CloudHybridProviderOptions = {}) {
    super()
    const namespace = normalizeNamespace(options)
    const baseUrl = (options.baseUrl || getCloudApiBaseUrl()).replace(/\/$/, '')
    this.fileView = new CloudFileView(namespace, baseUrl)
    this.queueView = new CloudQueueView(namespace)
  }

  isSupported() {
    return this.fileView.isSupported()
  }

  async initialize() {
    await this.fileView.initialize()
    await this.queueView.initialize()
    this.ready = true
    this.emit({ type: 'ready' })
  }

  async destroy() {
    await this.fileView.destroy()
    await this.queueView.destroy()
    await super.destroy()
  }

  asQueue() {
    return this.queueView
  }

  asFile() {
    return this.fileView
  }

  push(chunk: Blob) { return this.queueView.push(chunk) }
  getChunk(index: number) { return this.queueView.getChunk(index) }
  count() { return this.queueView.count() }
  getBlob(mimeType?: string) { return this.queueView.getBlob(mimeType) }
  getMediaURL(mimeType?: string) { return this.queueView.getMediaURL(mimeType) }

  createWritableStream(filename: string) { return this.fileView.createWritableStream(filename) }
  appendToFile(filename: string, data: Blob | Uint8Array) { return this.fileView.appendToFile(filename, data) }
  getFileURL(filename: string) { return this.fileView.getFileURL(filename) }
  getFileBlob(filename: string) { return this.fileView.getFileBlob(filename) }
  getFileSize(filename: string) { return this.fileView.getFileSize(filename) }
  listFiles() { return this.fileView.listFiles() }
  hasFile(filename: string) { return this.fileView.hasFile(filename) }
  deleteFile(filename: string) { return this.fileView.deleteFile(filename) }

  async clear() {
    await this.queueView.clear()
    await this.fileView.clear()
  }
}
