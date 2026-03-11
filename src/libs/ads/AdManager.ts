/**
 * AdManager — 广告管理器实现
 *
 * 统一入口，管理所有 provider 的注册、初始化、广告位创建和全局事件。
 * 业务层只操作 AdManager，不直接碰具体 SDK。
 */

import type { AdEventListener, AdSlotConfig, IAdManager, IAdProvider, IAdSlot } from './common'

export class AdManager implements IAdManager {
  private providers = new Map<string, IAdProvider>()
  private listeners: AdEventListener[] = []

  register(provider: IAdProvider): void {
    if (this.providers.has(provider.name)) {
      console.warn(`[AdManager] provider "${provider.name}" 已注册，将被覆盖`)
    }
    this.providers.set(provider.name, provider)
  }

  async initializeAll(configs: Record<string, Record<string, unknown>>): Promise<void> {
    const tasks = Array.from(this.providers.entries()).map(async ([name, provider]) => {
      const config = configs[name]
      if (!config) {
        console.warn(`[AdManager] provider "${name}" 没有提供配置，跳过初始化`)
        return
      }

      if (!provider.isSupported()) {
        console.warn(`[AdManager] provider "${name}" 在当前环境不可用，跳过初始化`)
        return
      }

      try {
        await provider.initialize(config)
      } catch (error) {
        console.error(`[AdManager] provider "${name}" 初始化失败:`, error)
      }
    })

    await Promise.allSettled(tasks)
  }

  getProvider(name: string): IAdProvider | undefined {
    return this.providers.get(name)
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  createSlot(providerName: string, config: AdSlotConfig): IAdSlot {
    const provider = this.providers.get(providerName)
    if (!provider) {
      throw new Error(`[AdManager] provider "${providerName}" 未注册`)
    }

    if (!provider.isInitialized()) {
      throw new Error(`[AdManager] provider "${providerName}" 尚未初始化`)
    }

    const slot = provider.createSlot(config)
    slot.on((event) => {
      for (const listener of this.listeners) {
        try {
          listener(event)
        } catch {
          // ignore listener errors
        }
      }
    })

    return slot
  }

  on(listener: AdEventListener): void {
    this.listeners.push(listener)
  }

  off(listener: AdEventListener): void {
    this.listeners = this.listeners.filter((fn) => fn !== listener)
  }

  destroy(): void {
    for (const provider of this.providers.values()) {
      try {
        provider.destroy()
      } catch {
        // ignore
      }
    }
    this.providers.clear()
    this.listeners = []
  }
}

/**
 * 全局单例 — 整个应用共享一个 AdManager
 */
let globalAdManager: AdManager | null = null

export function getAdManager(): AdManager {
  if (!globalAdManager) {
    globalAdManager = new AdManager()
  }
  return globalAdManager
}

export function resetAdManager(): void {
  if (globalAdManager) {
    globalAdManager.destroy()
    globalAdManager = null
  }
}
