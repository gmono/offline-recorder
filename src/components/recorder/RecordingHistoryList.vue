<template>
  <UiCard title="历史录音" eyebrow="Library" subtitle="所有记录都离线保存在浏览器与本地文件层。">
    <template #actions>
      <slot name="toolbar" />
    </template>

    <div v-if="!items.length" class="glass-soft px-4 py-6 text-sm leading-6 text-slate-500">
      还没有历史录音，开始第一次录制后会出现在这里。
    </div>

    <div v-else class="app-scrollbar flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
      <article
        v-for="item in items"
        :key="item.id"
        class="glass-soft px-4 py-4 transition duration-200"
        :class="item.id === activeId ? 'ring-2 ring-[#6C5CE7]/35' : 'hover:-translate-y-0.5'"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">{{ item.name }}</h3>
            <p class="mt-1 break-all text-xs text-slate-400">{{ item.id }}</p>
          </div>
          <span
            class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            :class="item.id === activeId ? 'bg-[#6C5CE7]/12 text-[#6C5CE7]' : 'bg-slate-900/5 text-slate-500'"
          >
            {{ item.id === activeId ? '当前' : item.recordType === 'video' ? '视频' : '音频' }}
          </span>
        </div>

        <dl class="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500 sm:grid-cols-4">
          <div>
            <dt class="mb-1 uppercase tracking-[0.18em] text-slate-400">开始</dt>
            <dd class="text-slate-700">{{ item.startText }}</dd>
          </div>
          <div>
            <dt class="mb-1 uppercase tracking-[0.18em] text-slate-400">时长</dt>
            <dd class="text-slate-700">{{ item.lengthText }}</dd>
          </div>
          <div>
            <dt class="mb-1 uppercase tracking-[0.18em] text-slate-400">大小</dt>
            <dd class="text-slate-700">{{ item.sizeText }}</dd>
          </div>
          <div>
            <dt class="mb-1 uppercase tracking-[0.18em] text-slate-400">来源</dt>
            <dd class="text-slate-700">{{ item.source || '未记录' }}</dd>
          </div>
        </dl>

        <div class="mt-4 flex flex-wrap gap-2">
          <UiButton size="sm" variant="primary" @click="$emit('select', item.id)">查看</UiButton>
          <UiButton size="sm" variant="secondary" @click="$emit('download', item.id)">下载</UiButton>
          <UiButton size="sm" variant="warning" @click="$emit('rename', item.id)">重命名</UiButton>
          <UiButton size="sm" variant="danger" @click="$emit('remove', item.id)">删除</UiButton>
        </div>
      </article>
    </div>
  </UiCard>
</template>

<script>
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'

export default {
  name: 'RecordingHistoryList',
  components: {
    UiButton,
    UiCard,
  },
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    activeId: {
      type: String,
      default: '',
    },
  },
}
</script>
