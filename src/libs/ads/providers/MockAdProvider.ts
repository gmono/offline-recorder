/**
 * Mock 广告 Provider — 本地开发/调试用
 *
 * 不加载任何第三方 SDK，直接渲染占位卡片。
 * 可配合 DevTools 验证广告位布局、事件流和生命周期。
 *
 * 默认情况下，当未提供任何真实广告 key 时，AdManager 会自动使用此 provider。
 */

import type { AdSlotConfig, IAdProvider, IAdSlot } from '../common'
import { AdSlotBase } from '../AdSlotBase'

export interface MockAdConfig {
  /** 模拟广告加载延迟 (ms)，默认 800 */
  loadDelay?: number
  /** 模拟加载失败概率 (0-1)，默认 0 */
  failRate?: number
}

class MockAdSlot extends AdSlotBase {
  readonly provider = 'mock'
  private wrapper: HTMLElement | null = null
  private loadDelay: number
  private failRate: number

  constructor(config: AdSlotConfig, mockConfig: MockAdConfig) {
    super(config)
    this.loadDelay = mockConfig.loadDelay ?? 800
    this.failRate = mockConfig.failRate ?? 0
  }

  async load(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.loadDelay))

    if (Math.random() < this.failRate) {
      this.emit({ type: 'error', payload: new Error('Mock: 模拟加载失败') })
      throw new Error('Mock: 模拟加载失败')
    }

    this.ready = true
    this.emit({ type: 'loaded' })
  }

  async renderTo(container: HTMLElement): Promise<void> {
    this.container = container

    if (!this.ready) {
      await this.load()
    }

    const bannerHeight = this.config.format === 'banner' ? '90px' : '250px'
    const colors = {
      banner: { bg: 'rgba(108,92,231,0.08)', border: 'rgba(108,92,231,0.25)', text: '#6C5CE7' },
      interstitial: { bg: 'rgba(255,107,157,0.08)', border: 'rgba(255,107,157,0.25)', text: '#FF6B9D' },
      rewarded: { bg: 'rgba(0,245,160,0.08)', border: 'rgba(0,245,160,0.25)', text: '#00C853' },
      native: { bg: 'rgba(0,180,216,0.08)', border: 'rgba(0,180,216,0.25)', text: '#00B4D8' },
    }
    const style = colors[this.config.format] || colors.banner

    const wrapper = document.createElement('div')
    wrapper.style.cssText = `
      display:flex;align-items:center;justify-content:center;flex-direction:column;
      width:100%;min-height:${bannerHeight};
      background:linear-gradient(135deg,${style.bg},transparent);
      border-radius:16px;border:1px dashed ${style.border};
      color:${style.text};font-size:13px;padding:16px;text-align:center;
      font-family:system-ui,-apple-system,sans-serif;
      cursor:pointer;transition:all 0.2s;
    `
    wrapper.innerHTML = `
      <div style="font-weight:700;font-size:15px;margin-bottom:6px;">
        🧪 Mock Ad · ${this.config.format.toUpperCase()}
      </div>
      <div style="font-size:11px;color:#666;">
        slot: ${this.config.slotId}
      </div>
      <div style="font-size:10px;color:#aaa;margin-top:6px;">
        开发模式占位 — 点击模拟广告事件
      </div>
    `

    wrapper.addEventListener('click', () => {
      this.emit({ type: 'click' })
      console.log(`[MockAd] 点击事件 — slot: ${this.config.slotId}`)
    })

    container.innerHTML = ''
    container.appendChild(wrapper)
    this.wrapper = wrapper

    this.emit({ type: 'impression' })
  }

  show(): Promise<void> {
    console.log(`[MockAd] show() — interstitial/rewarded 模拟展示`)
    this.emit({ type: 'impression' })

    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.config.format === 'rewarded') {
          this.emit({ type: 'reward' })
        }
        this.emit({ type: 'closed' })
        resolve()
      }, 2000)
    })
  }

  destroy(): void {
    if (this.wrapper && this.container) {
      this.container.removeChild(this.wrapper)
    }
    this.wrapper = null
    this.container = null
    this.ready = false
  }
}

export class MockAdProvider implements IAdProvider {
  readonly name = 'mock'
  private initialized = false
  private mockConfig: MockAdConfig = {}

  isSupported(): boolean {
    return true
  }

  async initialize(config: Record<string, unknown>): Promise<void> {
    this.mockConfig = config as MockAdConfig
    this.initialized = true
    console.log('[MockAdProvider] 已初始化（开发模式广告占位）')
  }

  isInitialized(): boolean {
    return this.initialized
  }

  createSlot(config: AdSlotConfig): IAdSlot {
    return new MockAdSlot(config, this.mockConfig)
  }

  destroy(): void {
    this.initialized = false
  }
}
