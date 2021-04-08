<template>
  <div class="hello">
    <h1>当前录音:{{ nowRecordInfo == null ? "无" : nowRecordInfo.name }}</h1>
    <div>
      <div v-for="(item, k) in nowRecordInfo" :key="k">
        {{ k }}:{{ item instanceof Date ? formatDate(item) : item }}
      </div>
    </div>
    <audio :src="src" controls ref="player"></audio>
    <div>
      <el-button type="primary" @click="play">播放</el-button>
      <el-button type="primary" @click="play_pause">暂停</el-button>
      <el-button type="primary" @click="play_stop">停止</el-button>
    </div>
    <el-table :data="playList">
      <el-table-column label="名称" prop="name"></el-table-column>
      <el-table-column label="操作">
        <template slot-scope="scope">
          <el-button @click="select(scope.row.name)" type="primary" size="small"
            >查看</el-button
          >
          <el-button
            type="danger"
            size="small"
            @click="playlist_del(scope.row.name)"
            >删除</el-button
          >
          <el-button
            type="success"
            size="small"
            @click="playlist_download(scope.row.name)"
            >下载</el-button
          >
          <el-tooltip placement="top">
            <template slot="content">
              <div v-for="(i, k) in historyInfoMap[scope.row.name]" :key="k">
                {{ k }}:{{ i }}
              </div>
            </template>
            <el-button type="info" size="small">信息</el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <div>当前录制:{{ recordTime }}</div>
    <div></div>
    <el-button
      type="primary"
      v-if="nowState == 'normal' || nowState == 'stopped'"
      @click="start"
      >开始</el-button
    >
    <el-button type="primary" v-if="nowState == 'paused'" @click="resume"
      >继续</el-button
    >
    <el-button type="primary" v-if="nowState == 'recording'" @click="pause"
      >暂停</el-button
    >
    <el-button
      type="primary"
      v-if="nowState == 'recording' || nowState == 'paused'"
      @click="stop"
      >停止</el-button
    >
    <!-- <el-button type="primary" v-if="nowState=='stopped'" @click="play">播放</el-button> -->
    <el-button type="primary" v-if="nowState == 'stopped'" @click="download"
      >下载</el-button
    >
    <el-button type="primary" @click="clear">清除历史记录</el-button>
  </div>
</template>

<script>
import { get, set, del } from "idb-keyval";
import store, { remove } from "store2";
import * as dayjs from "dayjs";
const historyKey = "historyBlobs";
const infoMap = "historyBlobsInfoMap";
export default {
  name: "HelloWorld",
  props: {
    msg: String,
  },
  async mounted() {
    let stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    let recorder = new MediaRecorder(stream, {
      bitsPerSecond: 128000,
      audioBitrateMode: "variable",
      mimeType: "audio/webm",
    });
    recorder.ondataavailable = (d) => this.dataavailable(d);
    this.recorder = recorder;
    //loaddata indexs
    this.loadHistoryIdx();
  },
  data() {
    return {
      startTime: new Date(),
      endTime: new Date(),
      //当前录音信息
      // nowRecordInfo: {
      //   name: null,
      //   startTime: new Date(),
      //   endTime: new Date(),
      //   /**
      //    * @type {Date[]}
      //    */
      //   timeSpanList: [],
      // },
      nowRecordInfo: null,
      //blob array
      blobs: [],
      /**
       * @type {Blob}
       */
      mergedBlob: null,
      /**
       * @type {MediaRecorder}
       */
      recorder: null,
      src: "",
      /**
       * @type {String[]}
       */
      historyBlobsIdx: [],
      historyInfoMap: {},
      //state
      /**
       * @type {"normal"|"recording"|"paused"|"stopped"|"merging"}
       */
      nowState: "normal",
    };
  },
  computed: {
    recordTime() {
      return dayjs(0)
        .second(this.blobs.length)
        .subtract(8, "hours")
        .format("HH:mm:ss");
    },
    playList() {
      return this.historyBlobsIdx.map((item) => {
        return {
          name: item,
        };
      });
    },
  },
  methods: {
    //tools
    formatDate(d) {
      return dayjs(d).format("YYYY-MM-DD HH:mm:ss");
    },
    info_generate(name) {
      let text = "";
      let info = this.historyInfoMap[name];
      for (let k in info) {
        text += `${k}:${info[k]}\n`;
      }
      return text;
    },
    //playlist
    async playlist_del(name) {
      let res = await this.$confirm("是否要删除:" + name + "?");
      if (res == "confirm") {
        await this.removeItem(name);
      }
    },
    playlist_download(name) {
      this.$message.info("已开始下载：" + name);
    },
    //
    play() {
      /**
       * @type {HTMLAudioElement}
       */
      let player = this.$refs.player;
      player.play();
    },
    play_pause() {
      /**
       * @type {HTMLAudioElement}
       */
      let player = this.$refs.player;
      player.pause();
    },
    play_stop() {
      /**
       * @type {HTMLAudioElement}
       */
      let player = this.$refs.player;
      player.fastSeek(0);
      this.play_pause();
    },
    select(k) {
      console.log(k);
      //清除当前持有的录音(注意此函数不能在录音时调用否则丢失数据)
      if (this.nowState == "recording") {
        this.$message.error("不能在录音时进行播放，请先停止录音");
        return;
      }
      this.clearNow();
      this.readHistoryItem(k).then((b) => {
        this.loadNow(k, b);
        //设置状态
      });
    },
    /**
     * 状态控制
     * @param {"normal"|"recording"|"paused"|"stopped"|"merging"}  state
     */
    stateSwitch(state) {
      this.nowState = state;
    },
    /**
     * @param {BlobEvent} d
     */
    dataavailable(d) {
      this.blobs.push(d.data);
      this.endTime = new Date();
      console.log(d);
    },
    start() {
      this.startTime = new Date();
      this.endTime = new Date();
      this.recorder.start(1000);
      //state
      this.stateSwitch("recording");
    },
    resume() {
      /**
       * @type {MediaRecorder}
       */
      let record = this.recorder;
      record.resume();
      this.stateSwitch("recording");
    },
    pause() {
      /**
       * @type {MediaRecorder}
       */
      let record = this.recorder;
      record.pause();
      this.stateSwitch("paused");
    },
    stop() {
      this.recorder.stop();
      this.stateSwitch("merging");
      //mergeblobs
      console.log(this.blobs);
      this.mergeBlobs(this.blobs);
      //加入历史
      this.pushToHistory();
      //切换
      this.stateSwitch("stopped");
    },
    download() {
      if (this.src != "") {
        window.open(this.src, "_blank");
      }
    },
    clear() {
      this.clearHistroy();
    },
    //tools
    //merge blobs and set src
    /**
     * @param {Array<Blob>} blobs
     */
    mergeBlobs(blobs) {
      let ablobs = new Blob(blobs, { type: "audio/webm" });
      this.src = URL.createObjectURL(ablobs);
      this.mergedBlob = ablobs;
      //合并完成并产生关于此次录音的信息
      this.nowRecordInfo = {
        name: `record_${dayjs(this.startTime).format(
          "YYYY-MM-DD hh:mm:ss"
        )}_${dayjs(this.endTime).format("YYYY-MM-DD hh:mm:ss")}`,
        startTime: this.startTime,
        endTime: this.endTime,
        //暂时不赋值
        timeSpanList: [],
      };
    },
    clearNow() {
      if (this.src != null && this.src != "") {
        URL.revokeObjectURL(this.src);
        this.src = "";
        this.mergedBlob = null;
        this.blobs = [];
        this.nowRecordInfo = null;
      }
    },
    loadNow(name, blob) {
      this.clearNow();
      this.mergedBlob = blob;
      this.blobs = [];
      this.nowRecordInfo = this.historyInfoMap[name];
      this.src = URL.createObjectURL(blob);
    },
    async pushToHistory() {
      if (this.historyBlobsIdx.indexOf(this.nowRecordInfo.name) != -1) {
        throw new Error("已经存在同名历史记录");
      }
      if (this.mergedBlob == null || this.nowRecordInfo.name == null)
        throw new Error("错误调用");
      //添加历史记录并存储
      this.historyBlobsIdx.push(this.nowRecordInfo.name);
      store(historyKey, this.historyBlobsIdx);
      //存储信息对象
      this.historyInfoMap[this.nowRecordInfo.name] = this.nowRecordInfo;
      store(infoMap, this.historyInfoMap);
      //对实际数据进行存储 自动添加前缀
      await set(historyKey + this.nowRecordInfo.name, this.mergedBlob);
    },
    /**
     * 加载历史索引表
     */
    loadHistoryIdx() {
      if (store.has(historyKey)) this.historyBlobsIdx = store.get(historyKey);
      else this.historyBlobsIdx = [];
      if (store.has(infoMap)) this.historyInfoMap = store.get(infoMap);
      else this.historyInfoMap = [];
    },
    async clearHistroy() {
      //删除数据
      // console.log(this.historyBlobsIdx);
      for (let a of this.historyBlobsIdx) {
        await del(a);
      }
      store.remove(historyKey);
      this.clearNow();
      //
      this.loadHistoryIdx();
    },
    /**
     * 从历史记录中读取一条记录 返回blob(merged)
     * @param {string} name
     * @returns {Promise<Blob>}
     */
    async readHistoryItem(name) {
      if (this.historyBlobsIdx.indexOf(name) == -1) {
        //没有这条记录
        throw new Error("记录" + name + "不存在");
      }
      //读取
      let res = await get(historyKey + name);
      return res;
    },
    async removeItem(name) {
      if (this.historyBlobsIdx.indexOf(name) == -1)
        throw new Error("没有这个记录");
      this.historyBlobsIdx = this.historyBlobsIdx.filter((v) => v != name);
      delete this.historyInfoMap[name];
      store.set(infoMap, this.historyInfoMap);
      store.set(historyKey, this.historyBlobsIdx);
      //删除数据
      await remove(name);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
