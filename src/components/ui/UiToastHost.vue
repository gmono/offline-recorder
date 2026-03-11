<template>
  <div class="pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(92vw,420px)] flex-col gap-3">
    <transition-group name="fade-up">
      <div
        v-for="item in toastState.items"
        :key="item.id"
        class="pointer-events-auto glass-soft flex items-start gap-3 px-4 py-3 shadow-[0_18px_36px_rgba(15,23,42,0.12)]"
      >
        <div class="mt-1 h-2.5 w-2.5 flex-none rounded-full" :class="toneClass(item.type)" />
        <p class="flex-1 whitespace-pre-line text-sm leading-6 text-slate-700">{{ item.message }}</p>
        <button
          v-if="item.showClose"
          class="text-sm text-slate-400 transition hover:text-slate-700"
          type="button"
          @click="close(item.id)"
        >
          关闭
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { useToastState } from '@/ui/feedback'

export default {
  name: 'UiToastHost',
  data() {
    return {
      toastState: useToastState(),
    }
  },
  methods: {
    close(id) {
      const index = this.toastState.items.findIndex((item) => item.id === id)
      if (index >= 0) {
        this.toastState.items.splice(index, 1)
      }
    },
    toneClass(type) {
      return {
        info: 'bg-sky-400',
        success: 'bg-emerald-400',
        warning: 'bg-amber-400',
        error: 'bg-rose-400',
      }[type] || 'bg-sky-400'
    },
  },
}
</script>
