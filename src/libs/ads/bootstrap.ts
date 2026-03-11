/**
 * 广告系统启动器 — 根据环境变量自动注册和初始化所有可用的广告平台
 *
 * 环境变量约定（vue-cli 格式，必须以 VUE_APP_ 前缀）：
 *
 *   VUE_APP_GOOGLE_AD_CLIENT   — Google AdSense 发布商 ID
 *   VUE_APP_GOOGLE_AD_SLOT     — Google AdSense 默认广告位 ID
 *   VUE_APP_PANGLE_APP_ID      — 穿山甲 Web SDK 应用 ID
 *   VUE_APP_PANGLE_SLOT_ID     — 穿山甲默认广告位 ID
 *   VUE_APP_BAIDU_UNION_ID     — 百度联盟账户 ID
 *   VUE_APP_BAIDU_SLOT_ID      — 百度联盟默认广告位 ID
 *   VUE_APP_AD_DEBUG           — 是否强制启用 mock 模式 (true/1)
 *
 * 如果所有 key 都为空，自动回退到 mock provider。
 */

import { getAdManager } from './AdManager'
import { GoogleAdSenseProvider } from './providers/GoogleAdSenseProvider'
import { PangleWebProvider } from './providers/PangleWebProvider'
import { BaiduUnionProvider } from './providers/BaiduUnionProvider'
import { MockAdProvider } from './providers/MockAdProvider'

function envStr(key: string): string {
  return (process.env[key] ?? '').trim()
}

function envBool(key: string): boolean {
  const v = envStr(key).toLowerCase()
  return v === 'true' || v === '1'
}

export interface AdBootstrapResult {
  initialized: string[]
  skipped: string[]
  mock: boolean
}

export async function bootstrapAds(): Promise<AdBootstrapResult> {
  const manager = getAdManager()
  const forceDebug = envBool('VUE_APP_AD_DEBUG')
  const initialized: string[] = []
  const skipped: string[] = []

  const configs: Record<string, Record<string, unknown>> = {}

  // ─── Google AdSense ─────────────────────────────
  const googleClient = envStr('VUE_APP_GOOGLE_AD_CLIENT')
  if (googleClient && !forceDebug) {
    manager.register(new GoogleAdSenseProvider())
    configs['google-adsense'] = { adClient: googleClient }
  } else {
    skipped.push('google-adsense')
  }

  // ─── 穿山甲 / Pangle Web ─────────────────────────
  const pangleAppId = envStr('VUE_APP_PANGLE_APP_ID')
  if (pangleAppId && !forceDebug) {
    manager.register(new PangleWebProvider())
    configs['pangle-web'] = { appId: pangleAppId }
  } else {
    skipped.push('pangle-web')
  }

  // ─── 百度联盟 ──────────────────────────────────────
  const baiduUnionId = envStr('VUE_APP_BAIDU_UNION_ID')
  if (baiduUnionId && !forceDebug) {
    manager.register(new BaiduUnionProvider())
    configs['baidu-union'] = { unionId: baiduUnionId }
  } else {
    skipped.push('baidu-union')
  }

  // ─── Mock (开发模式/无 key 时自动回退) ────────────────
  const hasAnyRealProvider = Object.keys(configs).length > 0
  const useMock = forceDebug || !hasAnyRealProvider
  if (useMock) {
    manager.register(new MockAdProvider())
    configs.mock = { loadDelay: 600, failRate: 0 }
  }

  await manager.initializeAll(configs)

  for (const name of Object.keys(configs)) {
    const provider = manager.getProvider(name)
    if (provider?.isInitialized()) {
      initialized.push(name)
    }
  }

  const result: AdBootstrapResult = {
    initialized,
    skipped,
    mock: useMock,
  }

  console.log('[AdBootstrap]', result)
  return result
}

/**
 * 获取当前最优的 provider 名称（优先级：Google > 穿山甲 > 百度 > Mock）
 */
export function getPreferredProvider(): string {
  const manager = getAdManager()
  const priority = ['google-adsense', 'pangle-web', 'baidu-union', 'mock']

  for (const name of priority) {
    const provider = manager.getProvider(name)
    if (provider?.isInitialized()) {
      return name
    }
  }

  return 'mock'
}
