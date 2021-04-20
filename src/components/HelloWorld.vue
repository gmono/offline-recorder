<template>
  <div class="hello">
    <router-link to="/center">测试</router-link>
    <el-dialog :visible.sync="showPlayer" fullscreen>
      <div class="player">
        <div class="player_info">
          <h3>
            当前录音:{{ nowRecordInfo == null ? "无" : nowRecordInfo.name }}
          </h3>
          <div v-if="nowRecordInfo != null">
            <el-card shadow="never">
              <div>名称:{{ nowRecordInfo["name"] }}</div>
              <div>ID:{{ nowRecordInfo["id"] }}</div>
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
            <el-button type="success" @click="download">下载</el-button>
            <el-button type="danger" @click="downloadAll">下载全部</el-button>
            <el-button type="danger" @click="downloadAll_packed">打包下载全部</el-button>
            <el-button type="primary" @click="clear">清除历史记录</el-button>
          </div>

          <!-- <div v-if="nowRecordInfo!=null">
            <el-button type="primary" @click="play">播放</el-button>
            <el-button type="primary" @click="play_pause">暂停</el-button>
            <el-button type="primary" @click="play_stop">停止</el-button>
          </div> -->
        </div>
        <div class="player_list">
          <el-table
            max-height="600"
            border
            :data="playList"
            default-sort="startTime"
          >
            <el-table-column
              label="名称"
              prop="name"
              sortable=""
            ></el-table-column>
            <el-table-column
              label="开始时间"
              width="160px"
              prop="startTime"
              sortable=""
            >
              <template slot-scope="scope">
                <div>{{ formatDate(scope.row.startTime) }}</div>
              </template>
            </el-table-column>
            <el-table-column width="130px" label="大小" prop="size" sortable="">
              <template slot-scope="scope">
                <div>{{ filesize(scope.row.size) }}</div>
              </template>
            </el-table-column>
            <el-table-column
              width="100px"
              label="长度"
              prop="length"
              sortable=""
            >
              <template slot-scope="scope">
                <div>{{ secondToTime(scope.row.length) }}</div>
              </template>
            </el-table-column>

            <el-table-column
              label="操作"
              align="right"
              header-align="center"
              fixed="right"
            >
              <template slot-scope="scope">
                <el-button
                  @click="select(scope.row.id)"
                  type="primary"
                  size="small"
                  >查看</el-button
                >
                <el-button
                  type="danger"
                  size="small"
                  @click="playlist_del(scope.row.id)"
                  >删除</el-button
                >
                <el-button
                  type="success"
                  size="small"
                  @click="playlist_download(scope.row.id)"
                  >下载</el-button
                >
                <el-button
                  type="info"
                  size="small"
                  @click="playlist_rename(scope.row.id)"
                  >重命名</el-button
                >
                <!-- <el-tooltip placement="top">
                  <template slot="content">
                    <div v-for="(i, k) in info_generate(scope.row.id)" :key="k">
                      {{ i }}
                    </div>
                  </template>
                  <el-button type="info" size="small">信息</el-button>
                </el-tooltip> -->
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <div class="recorder" v-loading="stopping || loading">
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
      <el-divider></el-divider>
      <!-- 录音时操作 -->
      <el-button
        style="margin-right: 2rem"
        type="primary"
        v-if="nowState == 'recording'"
        @click="addPoint"
        >添加标记点(空格键添加)</el-button
      >
      <el-button
        type="primary"
        v-if="nowState == 'recording' || nowState == 'paused'"
        >添加笔记</el-button
      >
      <!-- 笔记编辑部分 -->
      <!-- 笔记显示部分 -->
      <div>
        <ul>
          <el-button
            @click="showRecordingPoint(idx)"
            type="text"
            v-for="(item, idx) in recordingInfo.points"
            :key="item.time"
          >
            {{ item.time }}
          </el-button>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
// import * as wave from "wavesurfer.js";
//标记点类型：point pause 表示手动添加的和暂停时自动添加的
//标记点中的内容 ，可修改，note:markdown格式保存的原始笔 string
// pointTime 添加时间
//可以给录音添加描述，存储在元数据中
//标记点的信息存储在元数据的points字段中
//目前设计为一次性读取所有录音的所有标记点（由于是文本占用内存不多）
//因此限制笔记长度为500字

// import WFPlayer from "wfplayer"
import { get, set, del, createStore, clear, entries } from "idb-keyval";
import { delay, json } from "ts-pystyle";
import filesize from "filesize";
import store from "store2";
import jszip from "jszip";
import * as dayjs from "dayjs";
import * as _ from "lodash";
import downloadjs from "js-file-downloader";
const historyKey = "historyBlobs";
const infoMap = "historyBlobsInfoMap";
const tempcache = "tempcache";
const cacheStore = createStore(tempcache, tempcache);
//录制信息
const recordingInfo = "recordingInfo";
export default {
  name: "HelloWorld",
  props: {
    msg: String,
  },
  async mounted() {
    this.loading = true;

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
    //加载上次的缓存
    if (!(await this.tempCacheEmpty())) {
      //有上次缓存 恢复上次状态
      this.loading = true;
      await this.startFormTempCache();
      this.loading = false;
    }
    this.loading = false;
  },
  data() {
    return {
      loading: false,
      //player
      player: null,
      //正在录制的信息 下面的startTime等以后也要转移到这个对象中
      //points:[{type:'pause'|’point'}]
      recordingInfo: {
        points: [],
      },
      startTime: new Date(),
      endTime: new Date(),

      //当前录音信息
      // nowRecordInfo: {
      //   id:"",
      //   name: null,
      //   startTime: new Date(),
      //   endTime: new Date(),
      //   length:100,
      //   /**
      //    * @type {Date[]}
      //    */
      //   timeSpanList: [],
      //   points:[]
      // },
      //当前的mergeBlob对应的Info，在mergeBlob阶段合成
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
      stopping: false,
    };
  },
  computed: {
    recordTime() {
      return dayjs(0)
        .second(this.blobs.length)
        .subtract(8, "hours")
        .format("HH:mm:ss");
    },
    // historyIdxs(){
    //   return _.keys(this.historyInfoMap)
    // }
    // playList() {
    //   return this.historyBlobsIdx.map((item) => {
    //     return {
    //       name: item,
    //     };
    //   });
    // },
  },
  asyncComputed: {
    async playList() {
      return await Promise.all(
        this.historyBlobsIdx.map(async (v) => {
          /**
           * @type {Blob}
           */
          let b = await this.readHistoryItem(v);
          return {
            name: this.historyInfoMap[v].name,
            id: v,
            size: b.size,
            length: this.historyInfoMap[v].length,
            startTime: this.historyInfoMap[v].startTime,
          };
        })
      );
    },
  },
  methods: {
    /**
     * 代理以在模板中用
     */
    filesize(s) {
      return filesize(s);
    },
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
    /**
     * @param {string} type
     * @param {string} note
     */
    createPoint(type, note) {
      let position = this.blobs.length;
      let nowTime = new Date();
      return {
        type,
        note,
        position,
        time: nowTime,
      };
    },
    formatDate(d) {
      return dayjs(d).format("YYYY-MM-DD HH:mm:ss");
    },
    secondToTime(i) {
      return dayjs(0).second(i).subtract(8, "hours").format("HH:mm:ss");
    },
    info_generate(name) {
      let text = [];
      let info = this.historyInfoMap[name];
      for (let k in info) {
        let v =
          k == "startTime" || k == "endTime"
            ? this.formatDate(info[k])
            : k == "length"
            ? this.secondToTime(info[k])
            : info[k];
        text.push(`${k}：${v}`);
      }
      return text;
    },
    //playlist
    async playlist_del(id) {
      let info = this.historyInfoMap[id];
      let res = await this.$confirm("是否要删除:" + info.name + "?");
      if (res == "confirm") {
        //如果是删除的当前的就自动清除当前
        if (id == this.nowRecordInfo.id) {
          this.clearNow();
        }
        await this.removeItem(id);
      }
    },
    async playlist_download(id) {
      let info = this.historyInfoMap[id];

      this.$message.info("已开始下载：" + info.name);
      let bloburl = URL.createObjectURL(await this.readHistoryItem(id));
      let infourl = URL.createObjectURL(new Blob([JSON.stringify(info)]));

      await this.downloadUrl(info.name + ".webm", bloburl);
      URL.revokeObjectURL(bloburl);

      //下载信息文件
      await this.downloadUrl(info.name + ".json", infourl);
      URL.revokeObjectURL(info);
    },

    async playlist_rename(id) {
      //重命名
      let res = await this.$prompt("请输入名称:", "命名录音", {
        showCancelButton: false,
        inputValue: this.historyInfoMap[id].name,
      });
      if (res.action == "confirm") {
        await this.renameItem(id, res.value);
      } else {
        await this.$alert("错误");
      }
    },
    //标记相关
    addPoint() {
      let point = this.createPoint("point", null);
      //加入正在录制
      this.recordingInfo.points.push(point);
    },
    showRecordingPoint(idx) {
      let item = this.recordingInfo.points[idx];
      this.$message(JSON.stringify(item));
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
      if (this.nowState == "recording" || this.nowState == "paused") {
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
    async dataavailable(d) {
      if (this.stopping) {
        return;
      }
      //收到
      let stopping = this.stopping;
      if (this.stopping) {
        this.stopping = false;
      }
      this.blobs.push(d.data);
      this.endTime = new Date();
      console.log(d);
      //自动保存
      // let tid=this.formatDate(new Date());
      //添加一个录制帧
      await this.addRecordFrame(d.data);
      //保存录制信息 用来加载
      await this.storeRecording();
      //如果是最后一帧 执行stopafter并重置停止标志
      if (stopping) {
        await this.stop_after();
        // this.stopping = false;
      }
    },
    async start() {
      this.clearNow();
      this.startTime = new Date();
      this.endTime = new Date();
      this.recorder.start(1000);
      //state
      await this.storeRecording();
      this.stateSwitch("recording");
    },
    async startFormTempCache() {
      if (await this.tempCacheEmpty()) throw new Error("不存在上次记录");
      this.blobs = await this.loadTempCache();
      // console.log(this.blobs);
      //加载上次保存的录制信息 开始和结束时间
      let riinfo = await store.get(recordingInfo);

      this.startTime = riinfo["startTime"];
      this.endTime = riinfo["endTime"];
      this.recordingInfo.points = riinfo["points"];
      this.recorder.start(1000);
      //state
      this.stateSwitch("recording");
      //暂停
      this.pause();
    },
    async storeRecording() {
      await store.set(recordingInfo, {
        startTime: this.startTime,
        endTime: this.endTime,
        ...this.recordingInfo,
      });
    },
    /**
     * 添加记录到临时缓存中
     */
    async addRecordFrame(frame) {
      //这里获取序号是同步执行 保证顺序
      let tid = this.blobs.length - 1;
      await set(tid, frame, cacheStore); //保存到临时缓存
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
    async clearTempCache() {
      await clear(cacheStore);
      //
    },
    async tempCacheEmpty() {
      // return (await keys(cacheStore)).length == 0;
      return (await get(0, cacheStore)) == undefined;
    },
    /**
     * 加载临时缓存 数组 如果是空则返回[]
     */
    async loadTempCache() {
      let ents = await entries(cacheStore);
      ents = ents.sort((a, b) => {
        a[0] - b[0];
      });
      // console.log(ents)
      let ret = ents.map((v) => v[1]);
      // for (let a = 0; ; a++) {
      //   let blob = await get(a, cacheStore);
      //   //如果undef 严格=
      //   if (blob === undefined) {
      //     break;
      //   } else {
      //     ret.push(blob);
      //   }
      // }
      return ret;
    },
    stop() {
      this.recorder.stop();
      //设定停止标志 接受最后一帧
      // this.stopping = true;
      //这里假设没有来的值
      //不等待调用
      // delay(1500).then(() => {
      //   //还没关闭
      //   if(this.stopping)
      //     this.stopping=false;
      //     this.stop_after();
      // });
      this.stopping = true;
      this.stop_after().then(() => {
        this.stopping = false;
      });
    },
    async stop_after() {
      //停止并结束 结束时需要清空临时缓存器
      // this.recorder.stop();
      //放开控制权 让最后一帧进来
      await delay(0);
      this.stateSwitch("merging");
      //mergeblobs
      // console.log(this.blobs);
      this.mergeBlobs(this.blobs);
      //加入历史
      this.pushToHistory();
      //清除临时缓存
      await this.clearTempCache();
      //切换
      this.stateSwitch("stopped");
      //重命名
      let res = await this.$prompt("请输入名称:", "命名录音", {
        showCancelButton: false,
        inputValue: this.nowRecordInfo.id,
      });
      if (res.action == "confirm") {
        let id = this.nowRecordInfo.id;
        await this.renameItem(this.nowRecordInfo.id, res.value);
        this.loadNow(id, await this.readHistoryItem(id));
      } else {
        await this.$alert("错误");
      }
    },
    async download() {
      if (this.src != "") {
        this.$message.info("已开始下载：" + this.nowRecordInfo.name);
        //这里不释放
        this.downloadUrl(this.nowRecordInfo.name + ".webm", this.src);
        let infourl = URL.createObjectURL(
          new Blob([JSON.stringify(this.nowRecordInfo)])
        );

        await this.downloadUrl(this.nowRecordInfo.name + ".json", infourl);
        URL.revokeObjectURL(infourl);
      }
    },
    async downloadAll() {
      let msg = this.$message.warning({
        message: "正在顺序下载所有内容",
        duration: 0,
        showClose: true,
      });
      for (let idx of this.historyBlobsIdx) {
        await this.playlist_download(idx);
      }
      msg.close();
    },
    async downloadAll_packed() {
      //下载全部列表中的文件 理论上只需要不断调用playlist_download就可以
      //
      let packmsg = this.$message.warning({
        message: "正在打包......",
        duration: 0,
        showClose: true,
      });

      let zip = new jszip();
      let idxs = this.historyBlobsIdx;
      for (let idx of idxs) {
        //每个item创建于一个文件夹 以id命名 因为不重复
        let folder = zip.folder(idx);
        let info = this.historyInfoMap[idx];
        let blob = await this.readHistoryItem(idx);
        //创建文件
        folder.file(`${id}.json`, json(info));
        folder.file(`${id}.webm`, blob);
        //生成
      }
      let content = await zip.generateAsync({ type: "blob" });
      let url = URL.createObjectURL(content);
      packmsg.close();
      this.$message.warning("已经开始下载打包文件");
      await this.downloadUrl(`packageRecords.zip`, url);
      URL.revokeObjectURL(url);
    },
    async removeNow() {
      await this.playlist_del(this.nowRecordInfo.id);
    },
    async clear() {
      let res = await this.$confirm("确定要清除所有记录吗?", {
        type: "warning",
      });
      if (res == "confirm") this.clearHistroy();
    },
    //tools
    async downloadUrl(name, url) {
      // let a = document.createElement("a");
      // a.download = name;
      // a.href = url;
      // a.click();
      let down = new downloadjs({
        url: url,
        filename: name,
      });
      //等待下载完 thenable这是
      await down;
      // if(autorevoke) URL.revokeObjectURL(url);
    },
    //merge blobs and set src
    /**
     * @param {Array<Blob>} blobs
     */
    mergeBlobs(blobs) {
      let ablobs = new Blob(blobs, { type: "audio/webm" });
      this.src = URL.createObjectURL(ablobs);
      this.mergedBlob = ablobs;
      //合并完成并产生关于此次录音的信息 id用于存储
      let id = `record_${dayjs(this.startTime).format(
        "YYYY-MM-DD hh:mm:ss"
      )}_${dayjs(this.endTime).format("YYYY-MM-DD hh:mm:ss")}`;
      this.nowRecordInfo = {
        name: id,
        id: id,
        startTime: this.startTime,
        endTime: this.endTime,
        //暂时不赋值
        timeSpanList: [],
        length: blobs.length,
        points: this.recordingInfo.points,
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
    loadNow(id, blob) {
      this.clearNow();
      this.mergedBlob = blob;
      this.blobs = [];
      this.nowRecordInfo = this.historyInfoMap[id];
      this.src = URL.createObjectURL(blob);
    },
    async pushToHistory() {
      if (this.historyBlobsIdx.indexOf(this.nowRecordInfo.id) != -1) {
        throw new Error("已经存在同名历史记录");
      }
      if (this.mergedBlob == null || this.nowRecordInfo.id == null)
        throw new Error("错误调用");
      //添加历史记录并存储
      await this.addItem(this.nowRecordInfo, this.mergedBlob);
    },
    async addItem(info, blob) {
      this.historyBlobsIdx.push(info.id);
      store(historyKey, this.historyBlobsIdx);
      //存储信息对象
      this.historyInfoMap[info.id] = info;
      store(infoMap, this.historyInfoMap);
      //对实际数据进行存储 自动添加前缀
      await set(historyKey + info.id, blob);
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
        await del(historyKey + a);
      }
      store.remove(historyKey);
      store.remove(infoMap);
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
    async renameItem(id, newName) {
      if (this.historyBlobsIdx.indexOf(id) == -1)
        throw new Error("没有这个记录");
      let blob = await this.readHistoryItem(id);
      //删除并重新存储
      let info = this.historyInfoMap[id];
      await this.removeItem(id);
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
@media screen and (max-width: 800px) {
  .recorder {
    width: 100%;
  }
}
.player {
  display: flex;
  flex-wrap: wrap;
}
.player_info {
  border: #e4e7ed solid 1px;
  flex: 2;
  margin-right: 2rem;
  padding: 1rem 3rem;
  min-width: 300px;
}

/* @media screen and (max-width:980px){
  .player_list{
    min-width: 100%;
  }
} */
.player_list {
  flex: 3;
  min-width: 980px;
}
</style>
