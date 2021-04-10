<template>
  <div id="app">
    <h1>离线录音机</h1>
    <el-card shadow="never">
      一款直接在浏览器中运行的录音机，数据离线实时保存
      <h3>
        切记本录音机不能在同一浏览器上同时打开两个，否则会造成存储混乱，对数据产生不可预测破坏
      </h3>
      <h3>请勿清除浏览器记录，录音文件及时下载防止丢失</h3>
      <h3>录音占用空间过大或一次录音时间过长时可能发生存储加载延迟，出现播放列表短暂不显示，等待一段时间即可</h3>
      <el-card class="inner-card" style="max-width: 800px; margin: auto">
        <div slot="header">
          <span class="feature-text">特性</span>
        </div>
        <li>
          断电，关闭浏览器或录音时间过长超出内存等问题，都不丢失数据，重新打开继续录
        </li>
        <li>数据保存在浏览器中，存储在本地电脑上，保护隐私</li>
        <li>支持同时录多份录音文件，不会出现不下载就消失的情况</li>
        <li>在线播放器，可在线预览，选择下载</li>
        <li>自动记录额外信息，如录音时间段，长度大小等</li>
      </el-card>
    </el-card>
    <div style="margin-top: 2rem"></div>
    <div>
      <HelloWorld msg="Welcome to Your Vue.js App" />
    </div>
  </div>
</template>

<script>
import HelloWorld from "./components/HelloWorld.vue";

export default {
  name: "App",
  components: {
    HelloWorld,
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.feature-text {
  font-size: 1.5rem;
}
.inner-card {
  border: #dcdfe6 solid 1px;
  width: 61.8%;
  margin: auto;
}
@media screen and (max-width: 800px) {
  .inner-card {
    width: 100%;
  }
}
</style>