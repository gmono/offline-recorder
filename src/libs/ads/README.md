# libs/ads — 广告系统

## 架构

与存储层（`libs/storages`）对齐的三层分层：

| 层 | 接口 | 职责 |
|---|---|---|
| **Provider** | `IAdProvider` | 对接单一广告平台 SDK（AdSense / 穿山甲 / 百度联盟 / Mock） |
| **Slot** | `IAdSlot` | 单个广告位实例，可渲染到 DOM、监听事件 |
| **Manager** | `IAdManager` | 管理所有 provider 的注册、初始化、广告位创建、全局事件 |

## 当前 Provider

| 名称 | 类 | 平台 | Web SDK |
|---|---|---|---|
| `google-adsense` | `GoogleAdSenseProvider` | Google AdSense | `adsbygoogle.js` |
| `pangle-web` | `PangleWebProvider` | 穿山甲 / GroMore (Web) | `tt_ads_sdk.js` |
| `baidu-union` | `BaiduUnionProvider` | 百度联盟 | `cpro/ui/cm.js` |
| `mock` | `MockAdProvider` | 开发/调试占位 | 无 |

## 环境变量

在 `.env.development` / `.env.production` 中配置（vue-cli 要求 `VUE_APP_` 前缀）：

```env
VUE_APP_AD_DEBUG=true              # 强制 Mock 模式
VUE_APP_GOOGLE_AD_CLIENT=          # ca-pub-xxxx
VUE_APP_GOOGLE_AD_SLOT=            # 默认广告位 ID
VUE_APP_PANGLE_APP_ID=             # 穿山甲应用 ID
VUE_APP_PANGLE_SLOT_ID=            # 穿山甲广告位 ID
VUE_APP_BAIDU_UNION_ID=            # 百度联盟账户 ID
VUE_APP_BAIDU_SLOT_ID=             # 百度联盟广告位 ID
```

所有 key 为空时自动回退到 `MockAdProvider`，零配置即可开发。

## 使用方式

### 1. 启动器（已在 main.ts 中调用）

```ts
import { bootstrapAds } from '@/libs/ads/bootstrap'
await bootstrapAds()  // 根据 env 自动注册并初始化
```

### 2. Vue 组件

```vue
<AdBanner slot-id="sidebar-1" format="banner" />
<AdDashboard />
```

### 3. 编程式

```ts
import { getAdManager, getPreferredProvider } from '@/libs/ads'

const manager = getAdManager()
const slot = manager.createSlot(getPreferredProvider(), {
  slotId: 'my-slot',
  format: 'banner',
})
await slot.load()
await slot.renderTo(document.getElementById('ad-container')!)
```

## 约束

- **UI / 业务层不要直接引用具体 Provider 类**，统一通过 `AdManager` 或 `bootstrapAds` + `getPreferredProvider` 使用。
- 新增平台只需：
  1. 在 `providers/` 创建类并实现 `IAdProvider`
  2. 在 `bootstrap.ts` 注册
  3. 在 `.env.*` 添加对应 key
- 不需要改动 AdManager、UI 组件或业务代码。
