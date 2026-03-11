/**
 * Fallback Queue Provider — 双队列容错后端
 *
 * 写入时同时写入 primary 和 fallback，读取时优先 primary，
 * primary 失败时自动降级到 fallback。
 *
 * 典型组合：OPFSQueue + IndexedDB → OPFS 不可用时自动用 IndexedDB 兜底。
 */

import type { IQueueProvider, ProviderMeta } from './common'
import { ProviderBase } from './ProviderBase'

export class FallbackQueueProvider extends ProviderBase implements IQueueProvider {
  readonly kind = 'queue' as const
  readonly meta: ProviderMeta

  private primary: IQueueProvider
  private fallback: IQueueProvider
  private usePrimary = true

  constructor(primary: IQueueProvider, fallback: IQueueProvider) {
    super()
    this.primary = primary
    this.fallback = fallback
    this.meta = {
      name: `fallback(${primary.meta.name},${fallback.meta.name})`,
      label: `${primary.meta.label} + ${fallback.meta.label} 容错`,
      description: `优先使用 ${primary.meta.label}，失败时自动降级到 ${fallback.meta.label}。`,
      capabilities: {
        streaming: primary.meta.capabilities.streaming,
        directURL: primary.meta.capabilities.directURL,
        persistent: true,
        requiresPermission: primary.meta.capabilities.requiresPermission,
      },
    }
  }

  isSupported(): boolean {
    return this.primary.isSupported() || this.fallback.isSupported()
  }

  async initialize(): Promise<void> {
    // 先初始化 fallback（它通常更可靠）
    await this.fallback.initialize()

    // 再尝试 primary
    if (this.primary.isSupported()) {
      try {
        await this.primary.initialize()
        this.usePrimary = true
      } catch (error) {
        console.warn(`[FallbackProvider] primary "${this.primary.meta.name}" 初始化失败，使用 fallback:`, error)
        this.usePrimary = false
      }
    } else {
      this.usePrimary = false
    }

    this.ready = true
    this.emit({ type: 'ready', payload: { usePrimary: this.usePrimary } })
  }

  async destroy(): Promise<void> {
    await this.primary.destroy()
    await this.fallback.destroy()
    await super.destroy()
  }

  /** 当前是否在用 primary */
  isUsingPrimary(): boolean {
    return this.usePrimary
  }

  /** 获取当前活跃的 provider */
  getActive(): IQueueProvider {
    return this.usePrimary ? this.primary : this.fallback
  }

  async push(chunk: Blob): Promise<void> {
    if (this.usePrimary) {
      try {
        await this.primary.push(chunk)
        // 同步写入 fallback（容错镜像）
        try { await this.fallback.push(chunk) } catch { /* best effort */ }
        return
      } catch (error) {
        console.warn(`[FallbackProvider] primary push 失败，降级到 fallback:`, error)
        this.usePrimary = false
        this.emit({ type: 'error', payload: { failedProvider: this.primary.meta.name, error } })
      }
    }
    await this.fallback.push(chunk)
  }

  async getChunk(index: number): Promise<Blob> {
    if (this.usePrimary) {
      try {
        return await this.primary.getChunk(index)
      } catch {
        // fall through
      }
    }
    return this.fallback.getChunk(index)
  }

  async count(): Promise<number> {
    if (this.usePrimary) {
      try {
        return await this.primary.count()
      } catch {
        // fall through
      }
    }
    return this.fallback.count()
  }

  async getAllChunks(): Promise<Blob[]> {
    if (this.usePrimary) {
      try {
        return await this.primary.getAllChunks()
      } catch {
        // fall through
      }
    }
    return this.fallback.getAllChunks()
  }

  async getBlob(mimeType?: string): Promise<Blob> {
    if (this.usePrimary) {
      try {
        return await this.primary.getBlob(mimeType)
      } catch {
        // fall through
      }
    }
    return this.fallback.getBlob(mimeType)
  }

  async getMediaURL(mimeType?: string): Promise<string> {
    if (this.usePrimary) {
      try {
        return await this.primary.getMediaURL(mimeType)
      } catch {
        // fall through
      }
    }
    return this.fallback.getMediaURL(mimeType)
  }

  async clear(): Promise<void> {
    // 清空两个
    const errors: unknown[] = []
    try { await this.primary.clear() } catch (e) { errors.push(e) }
    try { await this.fallback.clear() } catch (e) { errors.push(e) }
    if (errors.length === 2) throw errors[0]
  }
}
