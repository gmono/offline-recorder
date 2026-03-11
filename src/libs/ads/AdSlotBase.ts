/**
 * 广告位基类 — 所有 provider 的广告位实现都继承此基类
 *
 * 封装了公共的事件分发、状态管理、DOM 生命周期。
 */

import type { AdSlotConfig, AdEvent, AdEventListener, IAdSlot } from './common'

export abstract class AdSlotBase implements IAdSlot {
  abstract readonly provider: string
  readonly config: AdSlotConfig

  protected ready = false
  protected container: HTMLElement | null = null
  private listeners: AdEventListener[] = []

  constructor(config: AdSlotConfig) {
    this.config = config
  }

  isReady(): boolean {
    return this.ready
  }

  on(listener: AdEventListener): void {
    this.listeners.push(listener)
  }

  off(listener: AdEventListener): void {
    this.listeners = this.listeners.filter((fn) => fn !== listener)
  }

  protected emit(event: Omit<AdEvent, 'provider' | 'slotId'>): void {
    const full: AdEvent = {
      ...event,
      provider: this.provider,
      slotId: this.config.slotId,
    }

    for (const listener of this.listeners) {
      try {
        listener(full)
      } catch {
        // listener errors should not break ad lifecycle
      }
    }
  }

  abstract load(): Promise<void>
  abstract renderTo(container: HTMLElement): Promise<void>
  abstract destroy(): void
}
