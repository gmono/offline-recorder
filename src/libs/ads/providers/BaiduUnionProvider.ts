/**
 * 百度联盟 Provider — 百度广告联盟 Web 端接入
 *
 * 使用百度联盟的 JS 投放代码（cpro / union），是国内 Web 广告最稳定的选择之一。
 *
 * 环境变量：
 *   VUE_APP_BAIDU_UNION_ID  — 百度联盟账户 ID
 */

import type { AdSlotConfig, IAdProvider, IAdSlot } from '../common'
import { AdSlotBase } from '../AdSlotBase'
import { loadScript } from '../scriptLoader'

declare global {
  interface Window {
    /** 百度联盟全局变量 */
    cpro_client?: string
    BAIDU_CLB_fillSlot?: (slotId: string) => void
    BAIDU_CLB_fillSlotAsync?: (slotId: string) => void
  }
}

const BAIDU_SCRIPT_ID = 'baidu-union-sdk'

export interface BaiduUnionConfig {
  /** 百度联盟账户 ID */
  unionId: string
}

class BaiduUnionSlot extends AdSlotBase {
  readonly provider = 'baidu-union'
  private slotElement: HTMLElement | null = null

  constructor(config: AdSlotConfig, private readonly unionId: string) {
    super(config)
  }

  async load(): Promise<void> {
    this.ready = true
    this.emit({ type: 'loaded' })
  }

  async renderTo(container: HTMLElement): Promise<void> {
    this.container = container

    const wrapper = document.createElement('div')
    wrapper.id = `baidu-ad-${this.config.slotId}`
    wrapper.style.width = '100%'

    container.innerHTML = ''
    container.appendChild(wrapper)
    this.slotElement = wrapper

    try {
      if (typeof window.BAIDU_CLB_fillSlotAsync === 'function') {
        window.BAIDU_CLB_fillSlotAsync(this.config.slotId)
      } else {
        // 非生产环境或 SDK 未加载时使用占位
        wrapper.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;
                      background:linear-gradient(135deg,rgba(32,128,226,0.06),rgba(0,180,42,0.06));
                      border-radius:16px;border:1px dashed rgba(32,128,226,0.2);color:#2080e2;
                      font-size:13px;padding:16px;text-align:center;">
            百度联盟广告位 · ${this.config.slotId}<br/>
            <span style="font-size:11px;color:#999;margin-top:4px;display:block;">
              联盟 ID: ${this.unionId}，生产环境自动填充
            </span>
          </div>`
      }
      this.emit({ type: 'impression' })
    } catch (error) {
      this.emit({ type: 'error', payload: error })
    }
  }

  destroy(): void {
    if (this.slotElement && this.container) {
      this.container.removeChild(this.slotElement)
    }
    this.slotElement = null
    this.container = null
    this.ready = false
  }
}

export class BaiduUnionProvider implements IAdProvider {
  readonly name = 'baidu-union'
  private unionId = ''
  private initialized = false

  isSupported(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined'
  }

  async initialize(config: Record<string, unknown>): Promise<void> {
    const cfg = config as unknown as BaiduUnionConfig
    if (!cfg.unionId) {
      throw new Error('BaiduUnionProvider: 缺少 unionId (百度联盟账户 ID)')
    }

    this.unionId = cfg.unionId

    try {
      await loadScript(
        `https://cpro.baidustatic.com/cpro/ui/cm.js`,
        BAIDU_SCRIPT_ID,
      )
    } catch {
      console.warn('[BaiduUnionProvider] SDK 脚本加载失败，将使用占位模式')
    }

    this.initialized = true
  }

  isInitialized(): boolean {
    return this.initialized
  }

  createSlot(config: AdSlotConfig): IAdSlot {
    if (!this.initialized) {
      throw new Error('BaiduUnionProvider: 请先调用 initialize()')
    }
    return new BaiduUnionSlot(config, this.unionId)
  }

  destroy(): void {
    this.initialized = false
  }
}
