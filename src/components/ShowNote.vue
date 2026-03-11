<template>
  <div class="space-y-4">
    <template v-if="data && data.type === 'point'">
      <div v-if="data.note && typeof data.note === 'object' && 'title' in data.note" class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="glass-soft px-4 py-3">
            <div class="text-xs uppercase tracking-[0.18em] text-slate-400">标题</div>
            <div class="mt-2 text-sm font-semibold text-slate-900">{{ data.note.title }}</div>
          </div>
          <div class="glass-soft px-4 py-3">
            <div class="text-xs uppercase tracking-[0.18em] text-slate-400">简述</div>
            <div class="mt-2 text-sm font-semibold text-slate-900">{{ data.note.desc }}</div>
          </div>
        </div>

        <div v-if="showMarkdown" class="glass-soft overflow-hidden p-2">
          <mavon-editor
            v-model="previewContent"
            :subfield="false"
            default-open="preview"
            :editable="false"
            :toolbars="{}"
            style="min-height: 360px"
          />
        </div>
        <div v-else class="glass-soft px-4 py-5 text-sm text-slate-700">
          {{ data.note.title }}
        </div>
      </div>
      <div v-else class="glass-soft px-4 py-5 text-sm text-slate-700">
        标记点：{{ data.time }}
      </div>
    </template>
    <div v-else-if="data && data.type === 'pause'" class="glass-soft px-4 py-5 text-sm text-slate-700">
      录制在 {{ data.time || '未知时间' }} 发生暂停。
    </div>
    <div v-else class="glass-soft px-4 py-5 text-sm text-slate-500">
      暂无内容。
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShowNote',
  props: {
    data: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    showMarkdown() {
      return Boolean(this.data?.note?.content && this.data.note.content !== this.data.note.title)
    },
    previewContent: {
      get() {
        return this.data?.note?.content || ''
      },
      set() {
        // preview only
      },
    },
  },
}
</script>
