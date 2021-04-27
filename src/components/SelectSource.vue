<template>
  <div>
    medialist:
    <el-select v-model="selected">
      <el-option
        v-for="i in medianames"
        :label="i.name"
        :value="i.value"
        :key="i.value"
      >
      </el-option>
    </el-select>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selected: "",
      medianames: [
        { name: "麦克风（音频）", value: "mic" },
        { name: "摄像头（视频+音频）", value: "capture" },
        { name: "录屏(视频+电脑内音频）", value: "screen" },
        { name: "内部音源(电脑内音频）", value: "audiooutput" },
      ],
      typemap: {
        mic: "audio",
        capture: "video",
        screen: "video",
        audiooutput: "audio",
      },
    };
  },
  watch: {
    async selected() {
      let a = await this.getMediaStream(this.selected);
      console.log(a);
      this.$emit("select", { stream: a, type: this.typemap[this.selected] });
    },
  },
  async mounted() {},
  methods: {
    async getMediaStream(name) {
      let funcs = {
        async mic() {
          return navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
        },
        async capture() {
          return navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
        },
        async screen() {
          return navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: true,
          });
        },
        async audiooutput() {
          //此处可能需要做一个stream来过滤视频
          return navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: false,
          });
        },
      };
      console.assert(name in funcs);
      return await funcs[name]();
    },
  },
};
</script>

<style>
</style>