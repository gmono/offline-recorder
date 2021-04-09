<template>
  <div class="hello">
    <el-dialog :visible.sync="showPlayer" fullscreen>
      <div class="player">
        <div class="player_info">
          <h3>
            当前录音:{{ nowRecordInfo == null ? "无" : nowRecordInfo.name }}
          </h3>
          <div v-if="nowRecordInfo != null">
            <el-card shadow="never">
              <div>名称:{{ nowRecordInfo["name"] }}</div>
              <div>长度:{{ secondToTime(nowRecordInfo["length"]) }}</div>
              <div>开始时间:{{ formatDate(nowRecordInfo["startTime"]) }}</div>
              <div>结束时间:{{ formatDate(nowRecordInfo["endTime"]) }}</div>
            </el-card>
          </div>
          <!-- <div ref="player_container" style="height:100px;width:100%"></div> -->
          <div style="margin-top: 2rem"></div>
          <audio :src="src" controls ref="player" style="outline: none"></audio>
          <div style="margin-top: 2rem"></div>

          <div>
            <el-button
              type="danger"
              @click="download"
              >下载</el-button
            >
            <el-button type="primary" @click="clear">清除历史记录</el-button>
          </div>

          <!-- <div v-if="nowRecordInfo!=null">
            <el-button type="primary" @click="play">播放</el-button>
            <el-button type="primary" @click="play_pause">暂停</el-button>
            <el-button type="primary" @click="play_stop">停止</el-button>
          </div> -->
        </div>
        <div class="player_list">
          <el-table border :data="playList">
            <el-table-column label="名称" prop="name"></el-table-column>
            <el-table-column label="操作">
              <template slot-scope="scope">
                <el-button
                  @click="select(scope.row.name)"
                  type="primary"
                  size="small"
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
                    <div
                      v-for="(i, k) in historyInfoMap[scope.row.name]"
                      :key="k"
                    >
                      {{ k }}:{{ i }}
                    </div>
                  </template>
                  <el-button type="info" size="small">信息</el-button>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <div class="recorder">
      <h2>当前录制:{{ recordTime }}</h2>
      <div></div>
      <el-button
        type="success"
        v-if="nowState == 'normal' || nowState == 'stopped'"
        @click="start"
        >开始</el-button
      >
      <el-button type="success" v-if="nowState == 'paused'" @click="resume"
        >继续</el-button
      >
      <el-button type="primary" v-if="nowState == 'recording'" @click="pause"
        >暂停</el-button
      >
      <el-button
        type="danger"
        v-if="nowState == 'recording' || nowState == 'paused'"
        @click="stop"
        >停止</el-button
      >
      <!-- <el-button type="primary" v-if="nowState=='stopped'" @click="play">播放</el-button> -->
      <el-button type="primary" v-if="nowState == 'stopped'" @click="download"
        >下载当前录音</el-button
      >
      <el-button v-if="nowState == 'stopped'" type="danger" @click="removeNow"
        >删除</el-button
      >
      <el-button type="warning" @click="show_player">显示播放器</el-button>
    </div>
  </div>
</template>

<script>
// import * as wave from "wavesurfer.js";

// import WFPlayer from "wfplayer"
import { get, set, del } from "idb-keyval";
import store from "store2";
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
    //加载播放器
  },
  data() {
    return {
      //player
      player: null,
      //
      startTime: new Date(),
      endTime: new Date(),
      //当前录音信息
      // nowRecordInfo: {
      //   name: null,
      //   startTime: new Date(),
      //   endTime: new Date(),
      //   length:100,
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
      showPlayer: false,
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
    show_player() {
      this.showPlayer = true;
      //在显示对话框后创建播放器
      // this.$nextTick(() => {
      //   let wf=new WFPlayer({
      //     container:this.$refs.player_container,
      //     waveColor:"red"
      //   });
      //   console.log(wf);
      //   wf.load(this.$refs.player);
      // });
    },
    //tools
    formatDate(d) {
      return dayjs(d).format("YYYY-MM-DD HH:mm:ss");
    },
    secondToTime(i) {
      return dayjs(0).second(i).subtract(8, "hours").format("HH:mm:ss");
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
        //如果是删除的当前的就自动清除当前
        if (name == this.nowRecordInfo.name) {
          this.clearNow();
        }
        await this.removeItem(name);
      }
    },
    async playlist_download(name) {
      this.$message.info("已开始下载：" + name);
      this.downloadUrl(
        name,
        URL.createObjectURL(await this.readHistoryItem(name))
      );
    },
    //
    play() {
      /**
       * @type {HTMLAudioElement}
       */
      let player = this.$refs.player;
      player.play();
      //
      // this.player.load(this.src);
      // this.player.savedVolume=100;

      // this.player.play();
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
      this.clearNow();
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
    async stop() {
      this.recorder.stop();
      this.stateSwitch("merging");
      //mergeblobs
      console.log(this.blobs);
      this.mergeBlobs(this.blobs);
      //加入历史
      this.pushToHistory();
      //切换
      this.stateSwitch("stopped");
      //重命名
      let res = await this.$prompt("请输入名称:", "命名录音", {
        showCancelButton: false,
        inputValue: this.nowRecordInfo.name,
      });
      if (res.action == "confirm") {
        await this.renameItem(this.nowRecordInfo.name, res.value);
        this.loadNow(res.value, await this.readHistoryItem());
      } else {
        await this.$alert("错误");
      }
    },
    download() {
      if (this.src != "") {
        this.$message.info("已开始下载：" + this.nowRecordInfo.name);
        this.downloadUrl(this.nowRecordInfo.name, this.src);
      }
    },
    async removeNow() {
      await this.playlist_del(this.nowRecordInfo.name);
    },
    clear() {
      this.clearHistroy();
    },
    //tools
    downloadUrl(name, url) {
      let a = document.createElement("a");
      a.download = name;
      a.href = url;
      a.click();
    },
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
        length: blobs.length,
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
      await this.addItem(this.nowRecordInfo, this.mergedBlob);
    },
    async addItem(info, blob) {
      this.historyBlobsIdx.push(info.name);
      store(historyKey, this.historyBlobsIdx);
      //存储信息对象
      this.historyInfoMap[info.name] = info;
      store(infoMap, this.historyInfoMap);
      //对实际数据进行存储 自动添加前缀
      await set(historyKey + info.name, blob);
    },
    /**
     * 加载历史索引表
     */
    loadHistoryIdx() {
      if (store.has(historyKey)) this.historyBlobsIdx = store.get(historyKey);
      else this.historyBlobsIdx = [];
      if (store.has(infoMap)) this.historyInfoMap = store.get(infoMap);
      else this.historyInfoMap = {};
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
      await del(historyKey + name);
    },
    /**
     * 重命名一个item
     */
    async renameItem(name, newName) {
      if (this.historyBlobsIdx.indexOf(name) == -1)
        throw new Error("没有这个记录");
      let blob = await this.readHistoryItem(name);
      //删除并重新存储
      let info = this.historyInfoMap[name];
      await this.removeItem(name);
      //重新存储
      info.name = newName;
      await this.addItem(info, blob);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.recorder {
  border: #dcdfe6 solid 1px;
  width: 61.8%;
  height: 500px;
  margin: auto;
}

.player {
  display: flex;
}
.player_info {
  border: #e4e7ed solid 1px;
  flex: 2;
  margin-right: 2rem;
  padding: 1rem 3rem;
}
.player_list {
  flex: 3;
}
</style>
