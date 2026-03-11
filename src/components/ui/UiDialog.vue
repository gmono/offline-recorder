<template>
  <transition name="fade-up">
    <div
      v-if="value"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      @click.self="handleClose('overlay')"
    >
      <div
        class="glass-panel relative max-h-[90vh] w-full overflow-hidden"
        :class="fullscreen ? 'h-full max-w-none rounded-none sm:h-auto sm:max-w-5xl sm:rounded-[28px]' : 'max-w-3xl'"
        :style="dialogStyle"
      >
        <div class="flex items-center justify-between gap-4 border-b border-[#e2e4ea] px-5 py-4 sm:px-6">
          <div>
            <p v-if="eyebrow" class="panel-title mb-2">{{ eyebrow }}</p>
            <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
          </div>
          <button
            class="btn-secondary !h-10 !w-10 !rounded-full !px-0 !py-0"
            type="button"
            @click="handleClose('button')"
          >
            ×
          </button>
        </div>
        <div class="app-scrollbar max-h-[calc(90vh-78px)] overflow-y-auto px-5 py-5 sm:px-6">
          <slot />
        </div>
        <div v-if="$slots.footer" class="border-t border-[#e2e4ea] px-5 py-4 sm:px-6">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'UiDialog',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '',
    },
    eyebrow: {
      type: String,
      default: '',
    },
    width: {
      type: String,
      default: '',
    },
    fullscreen: {
      type: Boolean,
      default: false,
    },
    closeOnOverlay: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    dialogStyle() {
      return this.width ? { maxWidth: this.width } : undefined
    },
  },
  methods: {
    handleClose(source = 'button') {
      if (source === 'overlay' && !this.closeOnOverlay) {
        return
      }
      this.$emit('input', false)
      this.$emit('close')
    },
  },
}
</script>
