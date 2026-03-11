/**
 * 广告系统抽象层
 *
 * 三层结构（与 storage 体系对齐）：
 *   IAdProvider  — 对接单一广告平台（AdSense / 穿山甲 / 百度联盟 …）
 *   IAdSlot      — 一个广告位实例，可渲染到 DOM
 *   IAdManager   — 管理多个 provider，提供统一入口
 *
 * 业务层只依赖接口和 AdManager，不直接碰具体 SDK。
 */

// ─── 广告位类型 ───────────────────────────────────

export type AdFormat = 'banner' | 'interstitial' | 'rewarded' | 'native'

// ─── 广告事件 ─────────────────────────────────────

export interface AdEvent {
  type: 'loaded' | 'impression' | 'click' | 'error' | 'closed' | 'reward'
  provider: string
  slotId: string
  payload?: unknown
}

export type AdEventListener = (event: AdEvent) => void

// ─── 广告位配置 ───────────────────────────────────

export interface AdSlotConfig {
  /** 广告位 ID（各平台分配） */
  slotId: string
  /** 广告格式 */
  format: AdFormat
  /** 自定义参数，透传给 provider */
  extras?: Record<string, unknown>
}

// ─── 广告位实例 ───────────────────────────────────

export interface IAdSlot {
  /** 当前广告位所属 provider 名称 */
  readonly provider: string
  /** 配置信息 */
  readonly config: AdSlotConfig
  /** 是否已加载就绪 */
  isReady(): boolean
  /** 加载广告（预拉取） */
  load(): Promise<void>
  /** 将广告渲染到指定容器 */
  renderTo(container: HTMLElement): Promise<void>
  /** 展示全屏类广告（interstitial / rewarded） */
  show?(): Promise<void>
  /** 销毁广告位 */
  destroy(): void
  /** 监听事件 */
  on(listener: AdEventListener): void
  /** 移除监听 */
  off(listener: AdEventListener): void
}

// ─── 广告提供者 ───────────────────────────────────

export interface IAdProvider {
  /** 平台唯一标识，如 'google-adsense', 'pangle-web', 'baidu-union' */
  readonly name: string
  /** 该平台是否在当前环境可用 */
  isSupported(): boolean
  /** 初始化 SDK（注入脚本、设置 key 等） */
  initialize(config: Record<string, unknown>): Promise<void>
  /** 是否已经初始化 */
  isInitialized(): boolean
  /** 创建一个广告位 */
  createSlot(config: AdSlotConfig): IAdSlot
  /** 销毁 provider，清理全局资源 */
  destroy(): void
}

// ─── 广告管理器 ───────────────────────────────────

export interface IAdManager {
  /** 注册一个 provider */
  register(provider: IAdProvider): void
  /** 初始化所有已注册 provider */
  initializeAll(configs: Record<string, Record<string, unknown>>): Promise<void>
  /** 获取指定 provider */
  getProvider(name: string): IAdProvider | undefined
  /** 获取所有已注册 provider 名称 */
  listProviders(): string[]
  /** 通过 provider 名称创建广告位 */
  createSlot(providerName: string, config: AdSlotConfig): IAdSlot
  /** 全局事件监听 */
  on(listener: AdEventListener): void
  off(listener: AdEventListener): void
  /** 销毁所有 */
  destroy(): void
}
