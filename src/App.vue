<template>
  <div id="app">
    <!-- <g-widget>
      <h1 style="background:red" :data-draggable="true">helloworld</h1>
    </g-widget> -->
    <h1>离线录音机</h1>
    <h4>一款直接在浏览器中运行的录音机，数据离线实时保存（尚未适配手机）</h4>
    <div class="inner-card">
      <el-collapse v-model="active" accordion>
        <el-collapse-item name="1">
          <template slot="title">
            <div style="padding-left: 2rem">功能</div>
          </template>
          <h3>
            断电，关闭浏览器或录音时间过长超出内存等问题，都不丢失数据，重新打开继续录
          </h3>
          <h3>数据保存在浏览器中，存储在本地电脑上，保护隐私</h3>
          <h3>支持同时录多份录音文件，不会出现不下载就消失的情况</h3>
          <h3>在线播放器，可在线预览，选择下载</h3>
          <h3>自动记录额外信息，如录音时间段，长度大小等</h3>
          <h3>
            可添加为WebApp（打开Chrome浏览器点击地址栏右侧“安装recorder"，手机可打开手机版Chrome后，根据底部提示操作）
          </h3>
        </el-collapse-item>
        <el-collapse-item name="2">
          <template slot="title">
            <div style="padding-left: 2rem">注意事项</div>
          </template>
          <h3>
            切记本录音机不能在同一浏览器上同时打开两个，否则会造成存储混乱，对数据产生不可预测破坏
          </h3>
          <h3>请勿清除浏览器记录，录音文件及时下载防止丢失</h3>
          <h3>
            录音占用空间过大或一次录音时间过长时可能发生存储加载延迟，出现播放列表短暂不显示，等待一段时间即可
          </h3>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div style="margin-top: 2rem"></div>
    <!-- <router-link to="/new">新录音机</router-link> -->
    <div>
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import GWidget from "./libcomponents/GWidget.vue";

export default {
  components: { GWidget },
  name: "App",
  data() {
    return {
      active: "2",
    };
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