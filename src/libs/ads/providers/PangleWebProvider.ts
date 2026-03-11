/**
 * 穿山甲 / Pangle Web Provider — 字节跳动广告 Web 端接入
 *
 * GroMore 是穿山甲的聚合中介层（主要用于原生 App），其 Web 端对应的是
 * 穿山甲 Web SDK (CSJ / Pangle JS)。此 provider 做 Web 端的最佳适配。
 *
 * SDK 文档: https://www.csjplatform.com/supportcenter/5396
 *
 * 环境变量：
 *   VUE_APP_PANGLE_APP_ID    — 穿山甲应用 ID
 *   VUE_APP_PANGLE_SLOT_ID   — 默认广告位 ID
 */

import type { AdSlotConfig, IAdProvider, IAdSlot } from '../common'
import { AdSlotBase } from '../AdSlotBase'
import { loadScript } from '../scriptLoader'

declare global {
  interface Window {
    /** 穿山甲 Web SDK 全局对象 */
    ToutiaoBridge?: unknown
    JEIAD?: {
      init: (config: Record<string, unknown>) => void
      cmd: {
        push: (fn: () => void) => void
      }
    }
  }
}

const PANGLE_SCRIPT_ID = 'pangle-web-sdk'

export interface PangleWebConfig {
  /** 穿山甲应用 ID */
  appId: string
  /** 是否开启调试模式 */
  debug?: boolean
}

class PangleWebSlot extends AdSlotBase {
  readonly provider = 'pangle-web'
  private adContainer: HTMLElement | null = null

  constructor(config: AdSlotConfig, private readonly appId: string) {
    super(config)
  }

  async load(): Promise<void> {
    this.ready = true
    this.emit({ type: 'loaded' })
  }

  async renderTo(container: HTMLElement): Promise<void> {
    this.container = container

    const wrapper = document.createElement('div')
    wrapper.id = `pangle-ad-${this.config.slotId}-${Date.now()}`
    wrapper.style.width = '100%'
    wrapper.style.minHeight = this.config.format === 'banner' ? '100px' : '250px'
    wrapper.setAttribute('data-pangle-slot', this.config.slotId)

    container.innerHTML = ''
    container.appendChild(wrapper)
    this.adContainer = wrapper

    try {
      if (window.JEIAD) {
        window.JEIAD.cmd.push(() => {
          window.JEIAD!.init({
            slotId: this.config.slotId,
            container: wrapper,
            appId: this.appId,
            type: this.config.format === 'banner' ? 'banner' : 'feed',
            ...((this.config.extras as Record<string, unknown>) || {}),
          })
        })
      } else {
        wrapper.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;
                      background:linear-gradient(135deg,rgba(255,76,0,0.06),rgba(255,152,0,0.06));
                      border-radius:16px;border:1px dashed rgba(255,76,0,0.2);color:#ff6d00;
                      font-size:13px;padding:16px;text-align:center;">
            穿山甲广告位 · ${this.config.slotId}<br/>
            <span style="font-size:11px;color:#999;margin-top:4px;display:block;">
              SDK 已配置 (appId: ${this.appId})，生产环境自动填充
            </span>
          </div>`
      }
      this.emit({ type: 'impression' })
    } catch (error) {
      this.emit({ type: 'error', payload: error })
    }
  }

  destroy(): void {
    if (this.adContainer && this.container) {
      this.container.removeChild(this.adContainer)
    }
    this.adContainer = null
    this.container = null
    this.ready = false
  }
}

export class PangleWebProvider implements IAdProvider {
  readonly name = 'pangle-web'
  private appId = ''
  private initialized = false

  isSupported(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined'
  }

  async initialize(config: Record<string, unknown>): Promise<void> {
    const cfg = config as unknown as PangleWebConfig
    if (!cfg.appId) {
      throw new Error('PangleWebProvider: 缺少 appId (穿山甲应用 ID)')
    }

    this.appId = cfg.appId

    // 穿山甲 Web SDK CDN
    try {
      await loadScript(
        `https://sf3-cdn-tos.douyinstatic.com/obj/eden-cn/psvhouloj/tt_ads_sdk.js`,
        PANGLE_SCRIPT_ID,
      )
    } catch {
      // 国内 CDN 可能在部分环境不可达，降级为占位模式
      console.warn('[PangleWebProvider] SDK 脚本加载失败，将使用占位模式')
    }

    this.initialized = true
  }

  isInitialized(): boolean {
    return this.initialized
  }

  createSlot(config: AdSlotConfig): IAdSlot {
    if (!this.initialized) {
      throw new Error('PangleWebProvider: 请先调用 initialize()')
    }
    return new PangleWebSlot(config, this.appId)
  }

  destroy(): void {
    this.initialized = false
  }
}
