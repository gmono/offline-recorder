<template>
  <div class="ad-dashboard">
    <UiCard padded eyebrow="Ads" title="广告平台状态" subtitle="已注册的广告平台和实时事件。">
      <div class="space-y-3">
        <div class="grid gap-2 sm:grid-cols-2">
          <div
            v-for="p in providerList"
            :key="p.name"
            class="glass-soft flex items-center gap-3 rounded-2xl px-4 py-3"
          >
            <span
              class="inline-block h-2.5 w-2.5 rounded-full"
              :class="p.initialized ? 'bg-emerald-400' : 'bg-slate-300'"
            />
            <div class="min-w-0 flex-1">
              <div class="text-sm font-semibold text-slate-800">{{ p.label }}</div>
              <div class="truncate text-xs text-slate-400">{{ p.name }}</div>
            </div>
            <span
              class="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              :class="
                p.initialized
                  ? 'bg-emerald-400/12 text-emerald-700'
                  : 'bg-slate-900/5 text-slate-400'
              "
            >{{ p.initialized ? '就绪' : '未初始化' }}</span>
          </div>
        </div>

        <div v-if="recentEvents.length">
          <div class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">最近事件</div>
          <div class="max-h-[180px] overflow-y-auto space-y-1">
            <div
              v-for="(evt, idx) in recentEvents"
              :key="idx"
              class="flex items-center gap-2 rounded-xl bg-slate-900/3 px-3 py-2 text-xs text-slate-500"
            >
              <span :class="eventDotClass(evt.type)" class="inline-block h-1.5 w-1.5 rounded-full" />
              <span class="font-medium text-slate-700">{{ evt.type }}</span>
              <span class="text-slate-400">{{ evt.provider }} · {{ evt.slotId }}</span>
              <span class="ml-auto text-slate-300">{{ formatTime(evt.time) }}</span>
            </div>
          </div>
        </div>
        <p v-else class="text-xs text-slate-400">暂无广告事件。</p>

        <div class="border-t border-white/40 pt-3">
          <div class="text-xs text-slate-400">
            模式：<strong class="text-slate-600">{{ isMockMode ? '开发占位' : '生产' }}</strong>
            &nbsp;·&nbsp;
            优先平台：<strong class="text-slate-600">{{ preferredProvider }}</strong>
          </div>
        </div>
      </div>
    </UiCard>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import UiCard from '@/components/ui/UiCard.vue'
import { getAdManager } from '@/libs/ads/AdManager'
import { getPreferredProvider } from '@/libs/ads/bootstrap'

const PROVIDER_LABELS = {
  'google-adsense': 'Google AdSense',
  'pangle-web': '穿山甲 / Pangle',
  'baidu-union': '百度联盟',
  mock: 'Mock (开发)',
}

export default {
  name: 'AdDashboard',
  components: { UiCard },
  data() {
    return {
      recentEvents: [],
      providerList: [],
      preferredProvider: 'mock',
      isMockMode: true,
    }
  },
  mounted() {
    this.refresh()

    const manager = getAdManager()
    manager.on((event) => {
      this.recentEvents.unshift({ ...event, time: new Date() })
      if (this.recentEvents.length > 50) {
        this.recentEvents = this.recentEvents.slice(0, 50)
      }
    })
  },
  methods: {
    refresh() {
      const manager = getAdManager()
      const names = manager.listProviders()
      this.providerList = names.map((name) => ({
        name,
        label: PROVIDER_LABELS[name] || name,
        initialized: manager.getProvider(name)?.isInitialized() ?? false,
      }))
      this.preferredProvider = getPreferredProvider()
      this.isMockMode = this.preferredProvider === 'mock'
    },
    formatTime(date) {
      return dayjs(date).format('HH:mm:ss')
    },
    eventDotClass(type) {
      return {
        loaded: 'bg-sky-400',
        impression: 'bg-emerald-400',
        click: 'bg-amber-400',
        error: 'bg-red-400',
        closed: 'bg-slate-400',
        reward: 'bg-purple-400',
      }[type] || 'bg-slate-300'
    },
  },
}
</script>
