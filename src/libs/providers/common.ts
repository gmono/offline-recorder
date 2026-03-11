/**
 * 录音存储 Provider 体系 — 接口定义
 *
 * 三种 Provider 类型（与旧 IStorage/ISequence/IBucket 三级对齐但语义更明确）：
 *
 *   IQueueProvider  — 队列提供者：按顺序写入 chunk，最终合并/播放
 *   IFileProvider   — 文件提供者：流式写入文件，直接获取 URL/下载
 *   IHybridProvider — 混合提供者：同时具备队列和文件能力
 *
 * 设计原则
 * ─────────────────
 * - UI / 业务层只依赖接口 + preset，不直接碰具体 Provider 实现
 * - OPFS/本地目录天然支持流式写入 → IFileProvider
 * - IndexedDB 天然支持 k-v 快速读写 → IQueueProvider
 * - HybridProvider 让 OPFS/本地目录同时提供两种能力
 *
 * 新增 Provider 只需实现接口并在 preset 中注册，零侵入。
 */

// ─── 事件 ──────────────────────────────────────────────

export interface ProviderEvent {
  type: 'ready' | 'error' | 'progress' | 'done'
  provider: string
  payload?: unknown
}

export type ProviderEventListener = (event: ProviderEvent) => void

// ─── Provider 元信息 ─────────────────────────────────────

export interface ProviderCapabilities {
  /** 支持流式写入（WritableStream） */
  streaming: boolean
  /** 支持直接文件 URL（免内存拷贝） */
  directURL: boolean
  /** 支持持久存储 */
  persistent: boolean
  /** 需要用户手动授权 */
  requiresPermission: boolean
}

export interface ProviderMeta {
  /** 全局唯一标识 */
  name: string
  /** 展示名 */
  label: string
  /** 描述 */
  description: string
  /** 能力标记 */
  capabilities: ProviderCapabilities
}

// ─── 基础 Provider 接口 ──────────────────────────────────

export interface IProviderBase {
  /** 元信息 */
  readonly meta: ProviderMeta
  /** 当前环境是否支持此 provider */
  isSupported(): boolean
  /** 是否已就绪 */
  isReady(): boolean
  /** 初始化（连DB、申请权限等） */
  initialize(config?: Record<string, unknown>): Promise<void>
  /** 释放资源 */
  destroy(): Promise<void>
  /** 事件监听 */
  on(listener: ProviderEventListener): void
  off(listener: ProviderEventListener): void
}

// ─── 队列 Provider ──────────────────────────────────────

export interface IQueueProvider extends IProviderBase {
  readonly kind: 'queue'
  /** 追加一个 chunk 到队列尾部 */
  push(chunk: Blob): Promise<void>
  /** 获取指定位置的 chunk */
  getChunk(index: number): Promise<Blob>
  /** 已入队 chunk 数量 */
  count(): Promise<number>
  /** 合并所有 chunk 为一个 Blob（内存中） */
  getBlob(mimeType?: string): Promise<Blob>
  /** 通过 MediaSource 创建可流式播放的 URL */
  getMediaURL(mimeType?: string): Promise<string>
  /** 清空全部 chunk */
  clear(): Promise<void>
  /** 读取所有 chunk（按顺序） */
  getAllChunks(): Promise<Blob[]>
}

// ─── 文件 Provider ──────────────────────────────────────

export interface IFileProvider extends IProviderBase {
  readonly kind: 'file'
  /**
   * 创建可写流 — 核心流式能力
   * 调用方可以直接往 WritableStream 写入 chunk，无需先缓存为 Blob。
   * OPFS 和本地目录都原生支持 createWritable()。
   */
  createWritableStream(filename: string): Promise<WritableStream<Uint8Array>>
  /**
   * 追加写入 — 在已有文件末尾追加数据
   * 适用于录音场景：持续追加录制帧。
   */
  appendToFile(filename: string, data: Blob | Uint8Array): Promise<void>
  /** 获取文件的直接 URL（免内存拷贝） */
  getFileURL(filename: string): Promise<string>
  /** 获取文件内容为 Blob */
  getFileBlob(filename: string): Promise<Blob>
  /** 获取文件大小 */
  getFileSize(filename: string): Promise<number>
  /** 列出所有文件 */
  listFiles(): Promise<string[]>
  /** 文件是否存在 */
  hasFile(filename: string): Promise<boolean>
  /** 删除文件 */
  deleteFile(filename: string): Promise<void>
  /** 清空全部文件 */
  clear(): Promise<void>
}

// ─── 混合 Provider ──────────────────────────────────────

export interface IHybridProvider extends IProviderBase {
  readonly kind: 'hybrid'
  /** 获取队列视图 */
  asQueue(): IQueueProvider
  /** 获取文件视图 */
  asFile(): IFileProvider

  // ─ 队列方法快捷方式 ─
  push(chunk: Blob): Promise<void>
  getChunk(index: number): Promise<Blob>
  count(): Promise<number>
  getBlob(mimeType?: string): Promise<Blob>
  getMediaURL(mimeType?: string): Promise<string>

  // ─ 文件方法快捷方式 ─
  createWritableStream(filename: string): Promise<WritableStream<Uint8Array>>
  appendToFile(filename: string, data: Blob | Uint8Array): Promise<void>
  getFileURL(filename: string): Promise<string>
  getFileBlob(filename: string): Promise<Blob>
  listFiles(): Promise<string[]>
  deleteFile(filename: string): Promise<void>

  /** 清空全部（队列+文件） */
  clear(): Promise<void>
}

// ─── Union Type ──────────────────────────────────────────

export type AnyProvider = IQueueProvider | IFileProvider | IHybridProvider

// ─── 工具类型 ──────────────────────────────────────────

/**
 * Provider 配置项（传给 preset 工厂）
 */
export interface ProviderConfig {
  /** 存储名称/命名空间 */
  name?: string
  /** 子目录 */
  subdirectories?: string | string[]
  /** 是否申请持久存储 */
  persistent?: boolean
  /** 已有的目录句柄（用于 Directory provider） */
  directoryHandle?: FileSystemDirectoryHandle
  /** 目录句柄记忆 key（用于恢复授权） */
  directoryHandleKey?: string
  /** 自定义参数 */
  extras?: Record<string, unknown>
}

/**
 * 从 AnyProvider 中安全提取队列能力
 */
export function asQueue(provider: AnyProvider): IQueueProvider | null {
  if (provider.kind === 'queue') return provider
  if (provider.kind === 'hybrid') return (provider as IHybridProvider).asQueue()
  return null
}

/**
 * 从 AnyProvider 中安全提取文件能力
 */
export function asFile(provider: AnyProvider): IFileProvider | null {
  if (provider.kind === 'file') return provider
  if (provider.kind === 'hybrid') return (provider as IHybridProvider).asFile()
  return null
}
