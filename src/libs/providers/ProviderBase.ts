/**
 * ProviderBase — 所有 Provider 的抽象基类
 *
 * 封装公共的事件分发、初始化状态管理。
 */

import type { ProviderEvent, ProviderEventListener, ProviderMeta, IProviderBase } from './common'

export abstract class ProviderBase implements IProviderBase {
  abstract readonly meta: ProviderMeta
  protected ready = false
  private listeners: ProviderEventListener[] = []

  isReady(): boolean {
    return this.ready
  }

  abstract isSupported(): boolean
  abstract initialize(config?: Record<string, unknown>): Promise<void>

  async destroy(): Promise<void> {
    this.ready = false
  }

  on(listener: ProviderEventListener): void {
    this.listeners.push(listener)
  }

  off(listener: ProviderEventListener): void {
    this.listeners = this.listeners.filter((fn) => fn !== listener)
  }

  protected emit(event: Omit<ProviderEvent, 'provider'>): void {
    const full: ProviderEvent = { ...event, provider: this.meta.name }
    for (const listener of this.listeners) {
      try {
        listener(full)
      } catch {
        // listener errors should not break provider lifecycle
      }
    }
  }

  protected ensureReady(): void {
    if (!this.ready) {
      throw new Error(`[${this.meta.name}] Provider 尚未初始化，请先调用 initialize()`)
    }
  }
}
