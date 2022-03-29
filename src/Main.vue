<template>
  <div id="app">
    <!-- <g-widget>
      <h1 style="background:red" :data-draggable="true">helloworld</h1>
    </g-widget> -->

    <!-- <router-link to="/new">新录音机</router-link> -->
    <div>
      <router-view></router-view>
    </div>
    <div style="height:100px"></div>
    <div style="padding:24px">
      <Vssue title="title" :options="option" />
    </div>
    <!-- <van-cell-group>
      <van-cell title="单元格" value="内容"/>
      <van-cell title="单元格" value="内容" label="描述内容"/>
    </van-cell-group> -->
  </div>
</template>

<script>
import GWidget from "./libcomponents/GWidget.vue";
import SelectSource from "./components/SelectSource.vue";
import { VssueComponent } from "vssue";
const productkeys = {
  clientId: "a66e7b749c1ec58019db",
  clientSecret: "099d2fb4b68dc287c0e13b0b05d5ece39f329bdf",
};
const developkeys = {
  clientId: "32f8e2e4a1df60d432d9",
  clientSecret: "2ee0d616dff257d3c78f8bcf86b99165193e7184",
};
// import Vssue from "vssue";
import "vssue/dist/vssue.css";
import Github from "@vssue/api-github-v4";

export default {
  components: { GWidget, SelectSource, Vssue: VssueComponent },
  name: "App",
  data() {
    return {
      active: "2",

      option: {
        // 设置要使用的平台 api
        api: Github,

        // 在这里设置你使用的平台的 OAuth App 配置
        owner: "gmono",
        repo: "offline-recorder-comments",
        // ...developkeys,
        ...productkeys,
        // 只有在使用某些平台时需要
      },
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
</style>
