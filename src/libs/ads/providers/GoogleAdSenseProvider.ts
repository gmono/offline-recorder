/**
 * Google AdSense Provider — Web 端 Google 广告接入
 *
 * 通过 `pagead2.googlesyndication.com/pagead/js/adsbygoogle.js` 加载 SDK，
 * 使用 `<ins class="adsbygoogle">` 展示广告。
 *
 * 环境变量：
 *   VUE_APP_GOOGLE_AD_CLIENT  — AdSense 发布商 ID (ca-pub-xxxx)
 */

import type { AdSlotConfig, IAdProvider, IAdSlot } from '../common'
import { AdSlotBase } from '../AdSlotBase'
import { loadScript } from '../scriptLoader'

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>
  }
}

const ADSENSE_SCRIPT_ID = 'google-adsense-sdk'

export interface GoogleAdSenseConfig {
  /** ca-pub-xxxx */
  adClient: string
  /** 是否启用自动广告 */
  autoAds?: boolean
}

class GoogleAdSenseSlot extends AdSlotBase {
  readonly provider = 'google-adsense'
  private insElement: HTMLElement | null = null

  constructor(config: AdSlotConfig, private readonly adClient: string) {
    super(config)
  }

  async load(): Promise<void> {
    this.ready = true
    this.emit({ type: 'loaded' })
  }

  async renderTo(container: HTMLElement): Promise<void> {
    this.container = container

    const ins = document.createElement('ins')
    ins.className = 'adsbygoogle'
    ins.style.display = 'block'
    ins.setAttribute('data-ad-client', this.adClient)
    ins.setAttribute('data-ad-slot', this.config.slotId)

    if (this.config.format === 'banner') {
      ins.setAttribute('data-ad-format', 'auto')
      ins.setAttribute('data-full-width-responsive', 'true')
    }

    if (this.config.extras) {
      for (const [key, value] of Object.entries(this.config.extras)) {
        ins.setAttribute(`data-${key}`, String(value))
      }
    }

    container.innerHTML = ''
    container.appendChild(ins)
    this.insElement = ins

    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      this.emit({ type: 'impression' })
    } catch (error) {
      this.emit({ type: 'error', payload: error })
    }
  }

  destroy(): void {
    if (this.insElement && this.container) {
      this.container.removeChild(this.insElement)
    }
    this.insElement = null
    this.container = null
    this.ready = false
  }
}

export class GoogleAdSenseProvider implements IAdProvider {
  readonly name = 'google-adsense'
  private adClient = ''
  private initialized = false

  isSupported(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined'
  }

  async initialize(config: Record<string, unknown>): Promise<void> {
    const cfg = config as unknown as GoogleAdSenseConfig
    if (!cfg.adClient) {
      throw new Error('GoogleAdSenseProvider: 缺少 adClient (ca-pub-xxxx)')
    }

    this.adClient = cfg.adClient

    const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.adClient}`
    await loadScript(src, ADSENSE_SCRIPT_ID)

    window.adsbygoogle = window.adsbygoogle || []
    this.initialized = true
  }

  isInitialized(): boolean {
    return this.initialized
  }

  createSlot(config: AdSlotConfig): IAdSlot {
    if (!this.initialized) {
      throw new Error('GoogleAdSenseProvider: 请先调用 initialize()')
    }
    return new GoogleAdSenseSlot(config, this.adClient)
  }

  destroy(): void {
    this.initialized = false
  }
}
