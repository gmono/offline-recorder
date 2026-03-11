<template>
  <section class="glass-panel relative overflow-hidden" :class="paddingClass">
    <div
      v-if="title || subtitle || $slots.actions"
      class="mb-4 flex flex-wrap items-start justify-between gap-3"
    >
      <div>
        <p v-if="eyebrow" class="panel-title mb-2">{{ eyebrow }}</p>
        <h2 v-if="title" class="text-lg font-semibold text-slate-900">{{ title }}</h2>
        <p v-if="subtitle" class="mt-1 text-sm text-slate-500">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </section>
</template>

<script>
export default {
  name: 'UiCard',
  props: {
    title: {
      type: String,
      default: '',
    },
    subtitle: {
      type: String,
      default: '',
    },
    eyebrow: {
      type: String,
      default: '',
    },
    padded: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    paddingClass() {
      return this.padded ? 'p-5 sm:p-6' : ''
    },
  },
}
</script>
