<template>
  <div>
    <el-form>
      <el-form-item label="媒体源">
        <el-select v-model="selected" @select="select">
          <el-option
            v-for="i in medianames"
            :label="i.name"
            :value="i.value"
            :key="i.value"
          >
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: String,
      default: "",
    },
  },
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
    value() {
      this.selected = this.value;
    },
    async selected() {
      // let a = await this.getMediaStream(this.selected);
      this.$emit("update:value", this.selected);
      this.$emit("select");
      // this.$emit(
      //   "select",
      //   a == null
      //     ? a
      //     : {
      //         stream: a,
      //         name: this.selected,
      //         type: this.typemap[this.selected],
      //       }
      // );
    },
  },
  methods: {
    select() {
      this.$emit("select");
    },
    async getSelectedStream() {
      let a = await this.getMediaStream(this.selected);
      if (a == null) return null;
      return {
        stream: a,
        name: this.selected,
        type: this.typemap[this.selected],
      };
    },
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
          //过滤视频
          //!暂不实现
          return navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: true,
          });
        },
      };
      if (name in funcs === false) return null;
      try {
        return await funcs[name]();
      } catch (e) {
        this.$message.error("此媒体源不可用，请切换媒体源");
        return null;
      }
    },
  },
};
</script>

<style>
</style>