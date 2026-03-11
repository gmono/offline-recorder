<template>
  <div>
    <RecordingPointList :points="points" @view="openPoint" />

    <UiDialog v-model="isShowingNote" title="查看记录" eyebrow="Timeline">
      <ShowNote :data="nowShowedNote" />
    </UiDialog>
  </div>
</template>

<script>
import RecordingPointList from '@/components/recorder/RecordingPointList.vue'
import ShowNote from '@/components/ShowNote.vue'
import UiDialog from '@/components/ui/UiDialog.vue'

export default {
  name: 'NoteList',
  components: {
    RecordingPointList,
    ShowNote,
    UiDialog,
  },
  props: {
    points: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      isShowingNote: false,
      nowShowedNote: {},
    }
  },
  methods: {
    openPoint(index) {
      this.nowShowedNote = this.points[index] || {}
      this.isShowingNote = true
    },
  },
}
</script>
