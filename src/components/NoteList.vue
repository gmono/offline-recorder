<template>
  <div>
    <el-dialog
      fullscreen
      append-to-body
      title="查看记录"
      :visible.sync="isShowingNote"
      @keypress.enter="isShowingNote = false"
    >
      <show-note :data="nowShowedNote"></show-note>
      <el-divider></el-divider>
      <el-button type="primary" @click="isShowingNote = false">关闭</el-button>
    </el-dialog>
    <div style="padding:2rem" id="notelist">
      <el-button
        v-for="(item, idx) in points"
        :key="formatDate(item.time)"
        style="margin-bottom: 1rem; margin-left: 2rem"
        @click="showRecordingPoint(idx)"
      >
        {{
          "title" in item.note
            ? `笔记:${item.note.title}`
            : `标记点:${formatDate(item.time)}`
        }}
      </el-button>
    </div>
  </div>
</template>

<script>
//笔记点击事件
import ShowNote from "./ShowNote.vue";
import dayjs from "dayjs";
export default {
  components: { ShowNote },
  //笔记列表
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
    };
  },
  methods: {
    formatDate(d) {
      return dayjs(d).format("YYYY-MM-DD HH:mm:ss");
    },
    showRecordingPoint(idx) {
      let item = this.points[idx];
      this.nowShowedNote = item;
      ``;
      this.isShowingNote = true;
      ``;
    },
  },
};
</script>

<style scoped>
#notelist {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
}
</style>
