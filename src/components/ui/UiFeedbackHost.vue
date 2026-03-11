<template>
  <UiDialog
    :value="dialogState.visible"
    :title="dialogState.title"
    :eyebrow="eyebrowText"
    width="560px"
    :close-on-overlay="dialogState.kind !== 'alert'"
    @input="handleDialogToggle"
  >
    <div class="space-y-4">
      <p class="whitespace-pre-line text-sm leading-7 text-slate-600">
        {{ dialogState.message }}
      </p>

      <input
        v-if="dialogState.kind === 'prompt'"
        ref="promptInput"
        :value="dialogState.inputValue"
        type="text"
        class="w-full rounded-lg border border-[#d1d5db] bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#0078d4] focus:ring-2 focus:ring-[#0078d4]/20"
        @input="handleInput"
        @keydown.enter.stop.prevent="handleConfirm"
        @keydown.esc.stop.prevent="handleCancel"
      />
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-3">
        <UiButton
          v-if="dialogState.kind !== 'alert'"
          variant="secondary"
          @click="handleCancel"
        >
          {{ dialogState.cancelText }}
        </UiButton>
        <UiButton variant="primary" @click="handleConfirm">
          {{ dialogState.confirmText }}
        </UiButton>
      </div>
    </template>
  </UiDialog>
</template>

<script>
import UiButton from '@/components/ui/UiButton.vue'
import UiDialog from '@/components/ui/UiDialog.vue'
import { cancelDialog, confirmDialog, updateDialogInput, useDialogState } from '@/ui/feedback'

export default {
  name: 'UiFeedbackHost',
  components: {
    UiButton,
    UiDialog,
  },
  data() {
    return {
      dialogState: useDialogState(),
    }
  },
  computed: {
    eyebrowText() {
      return {
        alert: 'Notice',
        confirm: 'Confirm',
        prompt: 'Prompt',
      }[this.dialogState.kind] || 'Notice'
    },
  },
  watch: {
    'dialogState.visible'(visible) {
      if (visible && this.dialogState.kind === 'prompt') {
        this.$nextTick(() => {
          const input = this.$refs.promptInput
          if (input && input.focus) {
            input.focus()
            input.select && input.select()
          }
        })
      }
    },
  },
  methods: {
    handleInput(event) {
      updateDialogInput(event.target.value)
    },
    handleConfirm() {
      confirmDialog()
    },
    handleCancel() {
      cancelDialog()
    },
    handleDialogToggle(value) {
      if (value) {
        return
      }
      if (this.dialogState.kind === 'alert') {
        this.handleConfirm()
        return
      }
      this.handleCancel()
    },
  },
}
</script>
