/**
 * Preset 机制 — 预设配置 + 工厂
 *
 * 业务层不需要知道具体 Provider 类的存在，只需要：
 *   1. 选一个 preset 名称（或用 'default'）
 *   2. 调用 createProviderFromPreset() 获得 provider 实例
 *
 * Presets
 * ───────────────────────────────────────────────
 *  default          IndexedDB 队列（最兼容，零权限）
 *  opfs-streaming   OPFS 混合（流式写入 + 队列 + 直接下载）
 *  local-directory  本地目录混合（写入用户选择的文件夹）
 *  hybrid-safe      OPFS + IndexedDB 容错（OPFS 挂了自动降级）
 *  max-performance  OPFS 纯文件（只有文件操作，无队列封装）
 */

import { IndexedDBQueueProvider } from './providers/IndexedDBQueueProvider'
import { OPFSFileProvider } from './providers/OPFSFileProvider'
import { OPFSHybridProvider } from './providers/OPFSHybridProvider'
import { DirectoryHybridProvider } from './providers/DirectoryHybridProvider'
import { CloudHybridProvider } from './providers/CloudHybridProvider'
import { FallbackQueueProvider } from './providers/FallbackProvider'
import type { AnyProvider, ProviderConfig } from './providers/common'
import { hasCloudToken } from './cloud/api'

// ─── Preset 名称 ──────────────────────────────────────

export type PresetName =
  | 'default'
  | 'opfs-streaming'
  | 'local-directory'
  | 'hybrid-safe'
  | 'cloud'
  | 'max-performance'

// ─── Preset 描述 ──────────────────────────────────────

export interface PresetDescriptor {
  /** 唯一标识 */
  name: PresetName
  /** 展示名 */
  label: string
  /** 说明 */
  description: string
  /** provider 的 kind（queue / file / hybrid） */
  providerKind: 'queue' | 'file' | 'hybrid'
  /** 当前环境是否可用 */
  isAvailable(): boolean
  /** 创建并初始化 provider */
  create(config?: ProviderConfig): Promise<AnyProvider>
}

// ─── OPFS 可用性检测 ──────────────────────────────────

function isOPFSAvailable(): boolean {
  return typeof navigator !== 'undefined' &&
    typeof (navigator.storage as any)?.getDirectory === 'function'
}

function isDirectoryAccessAvailable(): boolean {
  return typeof window !== 'undefined' &&
    typeof (window as any).showDirectoryPicker === 'function'
}

// ─── Preset 定义 ──────────────────────────────────────

export const PRESETS: Record<PresetName, PresetDescriptor> = {
  default: {
    name: 'default',
    label: 'IndexedDB',
    description: '兼容性最好，零权限。适合一般录音，所有浏览器通用。',
    providerKind: 'queue',
    isAvailable: () => typeof indexedDB !== 'undefined',
    async create(config?: ProviderConfig) {
      const provider = new IndexedDBQueueProvider(config?.name ?? 'recording-chunks')
      await provider.initialize()
      return provider
    },
  },

  'opfs-streaming': {
    name: 'opfs-streaming',
    label: 'OPFS 流式',
    description: '流式写入浏览器私有文件系统，直接生成下载链接，大文件录音推荐。',
    providerKind: 'hybrid',
    isAvailable: isOPFSAvailable,
    async create(config?: ProviderConfig) {
      const provider = new OPFSHybridProvider({
        rootDirectory: config?.name ?? 'offline-recorder',
        namespace: config?.subdirectories,
        ensurePersistentStorage: config?.persistent ?? true,
      })
      await provider.initialize()
      return provider
    },
  },

  'local-directory': {
    name: 'local-directory',
    label: '本地目录',
    description: '录音文件直接写入用户选择的本地文件夹，可用文件管理器直接查看。',
    providerKind: 'hybrid',
    isAvailable: isDirectoryAccessAvailable,
    async create(config?: ProviderConfig) {
      const provider = new DirectoryHybridProvider({
        subdirectory: config?.subdirectories,
        directoryHandle: config?.directoryHandle,
        handleKey: config?.directoryHandleKey ?? 'offline-recorder-dir',
      })
      await provider.initialize()
      return provider
    },
  },

  'hybrid-safe': {
    name: 'hybrid-safe',
    label: 'OPFS + IndexedDB 容错',
    description: '优先 OPFS 流式写入，失败自动降级到 IndexedDB，最安全的高性能方案。',
    providerKind: 'queue',
    isAvailable: () => typeof indexedDB !== 'undefined',
    async create(config?: ProviderConfig) {
      const opfs = new OPFSHybridProvider({
        rootDirectory: config?.name ?? 'offline-recorder',
        namespace: config?.subdirectories,
        ensurePersistentStorage: config?.persistent ?? true,
      })
      const idb = new IndexedDBQueueProvider(
        (config?.name ?? 'recording') + '-fallback',
      )

      // 尝试初始化 OPFS，创建队列视图
      let primaryQueue
      try {
        await opfs.initialize()
        primaryQueue = opfs.asQueue()
      } catch {
        primaryQueue = new IndexedDBQueueProvider(
          (config?.name ?? 'recording') + '-primary',
        )
        await primaryQueue.initialize()
      }

      const provider = new FallbackQueueProvider(primaryQueue, idb)
      await provider.initialize()
      return provider
    },
  },

  cloud: {
    name: 'cloud',
    label: '云后端',
    description: '检测到登录 token 后启用，临时队列实时写入 Rust 服务，历史文件同步到云端。',
    providerKind: 'hybrid',
    isAvailable: () => typeof fetch !== 'undefined' && hasCloudToken(),
    async create(config?: ProviderConfig) {
      const provider = new CloudHybridProvider({
        name: config?.name,
        namespace: config?.subdirectories,
      })
      await provider.initialize()
      return provider
    },
  },

  'max-performance': {
    name: 'max-performance',
    label: 'OPFS 纯文件',
    description: '纯文件操作模式，只有流式写入/读取，无队列封装。适合自定义录音流程。',
    providerKind: 'file',
    isAvailable: isOPFSAvailable,
    async create(config?: ProviderConfig) {
      const provider = new OPFSFileProvider({
        rootDirectory: config?.name ?? 'offline-recorder',
        namespace: config?.subdirectories,
        ensurePersistentStorage: config?.persistent ?? true,
      })
      await provider.initialize()
      return provider
    },
  },
}

// ─── 工厂函数 ──────────────────────────────────────────

/**
 * 通过 preset 名称创建 provider
 *
 * @example
 * const provider = await createProviderFromPreset('opfs-streaming')
 * // provider 是 IHybridProvider，可以 .push() 也可以 .createWritableStream()
 */
export async function createProviderFromPreset(
  presetName: PresetName,
  config?: ProviderConfig,
): Promise<AnyProvider> {
  const preset = PRESETS[presetName]
  if (!preset) {
    throw new Error(`[Preset] 未知的 preset: "${presetName}"`)
  }

  if (!preset.isAvailable()) {
    throw new Error(
      `[Preset] "${presetName}" 在当前环境不可用，` +
      `请使用 getAvailablePresets() 检查可用的 preset`,
    )
  }

  return preset.create(config)
}

/**
 * 智能创建 — 尝试指定 preset，失败自动降级到 default
 */
export async function createProviderSmart(
  preferredPreset: PresetName = 'opfs-streaming',
  config?: ProviderConfig,
): Promise<AnyProvider> {
  // 1. 尝试用户首选
  if (PRESETS[preferredPreset]?.isAvailable()) {
    try {
      return await createProviderFromPreset(preferredPreset, config)
    } catch (error) {
      console.warn(`[Preset] "${preferredPreset}" 创建失败，尝试降级:`, error)
    }
  }

  // 2. 尝试 hybrid-safe
  if (PRESETS['hybrid-safe'].isAvailable() && preferredPreset !== 'hybrid-safe') {
    try {
      return await createProviderFromPreset('hybrid-safe', config)
    } catch {
      // continue
    }
  }

  // 3. 最终兜底 — IndexedDB
  return createProviderFromPreset('default', config)
}

/**
 * 返回所有 preset 描述
 */
export function listPresets(): PresetDescriptor[] {
  return Object.values(PRESETS)
}

/**
 * 返回当前环境可用的 preset
 */
export function getAvailablePresets(): PresetDescriptor[] {
  return Object.values(PRESETS).filter((p) => p.isAvailable())
}

/**
 * 获取指定 preset 的描述
 */
export function getPreset(name: PresetName): PresetDescriptor | undefined {
  return PRESETS[name]
}
