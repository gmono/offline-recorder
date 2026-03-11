<template>
  <div>
    <div v-if="!points.length" class="glass-soft px-4 py-5 text-sm leading-6 text-slate-500">
      录制过程中可以添加标记点、简述或完整笔记，停止后会跟随录音一起保存。
    </div>
    <div v-else class="flex flex-wrap gap-2.5">
      <button
        v-for="(item, idx) in points"
        :key="item.time ? item.time.toString() : idx"
        type="button"
        class="btn-secondary !rounded-full !px-4 !py-2 text-xs"
        @click="$emit('view', idx)"
      >
        {{ labelFor(item) }}
      </button>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'

export default {
  name: 'RecordingPointList',
  props: {
    points: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    labelFor(item) {
      if (item?.note && typeof item.note === 'object' && 'title' in item.note) {
        return `笔记 · ${item.note.title}`
      }
      if (item?.type === 'pause') {
        return `暂停 · ${this.formatDate(item.time)}`
      }
      return `标记点 · ${this.formatDate(item.time)}`
    },
    formatDate(value) {
      return dayjs(value || Date.now()).format('HH:mm:ss')
    },
  },
}
</script>
