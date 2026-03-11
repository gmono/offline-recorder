<template>
  <div class="ad-banner" :class="{ 'ad-banner--loading': loading, 'ad-banner--error': hasError }">
    <div v-if="loading" class="ad-banner__loading">
      <span class="ad-banner__spinner" />
    </div>
    <div ref="adContainer" class="ad-banner__container" />
  </div>
</template>

<script>
/**
 * AdBanner — 通用广告位组件
 *
 * 使用方式：
 *   <AdBanner provider="google-adsense" slot-id="123456" format="banner" />
 *   <AdBanner provider="mock" slot-id="dev-test" format="banner" />
 *
 * 若不指定 provider，自动使用当前优先级最高的可用平台。
 */
import { getAdManager } from '@/libs/ads/AdManager'
import { getPreferredProvider } from '@/libs/ads/bootstrap'

export default {
  name: 'AdBanner',
  props: {
    /** 广告平台标识，为空时自动选择 */
    provider: { type: String, default: '' },
    /** 广告位 ID */
    slotId: { type: String, required: true },
    /** 广告格式 */
    format: { type: String, default: 'banner' },
    /** 透传给 provider 的额外配置 */
    extras: { type: Object, default: () => ({}) },
    /** 懒加载：进入视口后才加载 */
    lazy: { type: Boolean, default: true },
  },
  data() {
    return {
      loading: true,
      hasError: false,
      adSlot: null,
      observer: null,
    }
  },
  computed: {
    resolvedProvider() {
      return this.provider || getPreferredProvider()
    },
  },
  mounted() {
    if (this.lazy && typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            this.observer.disconnect()
            this.observer = null
            this.loadAd()
          }
        },
        { rootMargin: '200px' },
      )
      this.observer.observe(this.$el)
    } else {
      this.loadAd()
    }
  },
  beforeDestroy() {
    this.destroyAd()
    if (this.observer) {
      this.observer.disconnect()
    }
  },
  methods: {
    async loadAd() {
      try {
        const manager = getAdManager()
        const providerName = this.resolvedProvider
        const provider = manager.getProvider(providerName)

        if (!provider || !provider.isInitialized()) {
          this.loading = false
          this.hasError = true
          this.$emit('error', { message: `provider "${providerName}" 不可用` })
          return
        }

        this.adSlot = manager.createSlot(providerName, {
          slotId: this.slotId,
          format: this.format,
          extras: this.extras,
        })

        this.adSlot.on((event) => {
          this.$emit('ad-event', event)
          if (event.type === 'error') {
            this.hasError = true
          }
        })

        await this.adSlot.load()
        await this.adSlot.renderTo(this.$refs.adContainer)

        this.loading = false
      } catch (error) {
        this.loading = false
        this.hasError = true
        this.$emit('error', error)
      }
    },
    destroyAd() {
      if (this.adSlot) {
        this.adSlot.destroy()
        this.adSlot = null
      }
    },
  },
}
</script>

<style scoped>
.ad-banner {
  position: relative;
  width: 100%;
  min-height: 50px;
  overflow: hidden;
  border-radius: 16px;
}

.ad-banner--loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ad-banner__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.ad-banner__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(108, 92, 231, 0.15);
  border-top-color: #6c5ce7;
  border-radius: 50%;
  animation: ad-spin 0.7s linear infinite;
}

@keyframes ad-spin {
  to {
    transform: rotate(360deg);
  }
}

.ad-banner__container {
  width: 100%;
}

.ad-banner--error .ad-banner__container {
  min-height: 0;
}
</style>
