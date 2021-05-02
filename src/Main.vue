<template>
  <div id="app">
    <!-- <g-widget>
      <h1 style="background:red" :data-draggable="true">helloworld</h1>
    </g-widget> -->

    

    
    <!-- <router-link to="/new">新录音机</router-link> -->
    <div>
      <router-view></router-view>
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
export default {
  components: { GWidget, SelectSource },
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


</style>