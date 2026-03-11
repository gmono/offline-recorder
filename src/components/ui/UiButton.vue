<template>
  <button
    :type="nativeType"
    :disabled="disabled"
    :class="buttonClass"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script>
export default {
  name: 'UiButton',
  props: {
    variant: {
      type: String,
      default: 'secondary',
    },
    size: {
      type: String,
      default: 'md',
    },
    block: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    nativeType: {
      type: String,
      default: 'button',
    },
  },
  computed: {
    buttonClass() {
      const variantMap = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        danger: 'btn-danger',
        warning: 'btn-warning',
        success: 'btn-success',
      }

      const sizeMap = {
        sm: 'px-3 py-2 text-xs rounded-xl',
        md: 'px-4 py-3 text-sm',
        lg: 'px-5 py-3.5 text-sm',
      }

      return [
        variantMap[this.variant] || variantMap.secondary,
        sizeMap[this.size] || sizeMap.md,
        this.block ? 'w-full' : '',
      ]
    },
  },
}
</script>
