<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/>
    <!-- <AuthingGuard :appId="''"></AuthingGuard> -->
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import HelloWorld from './components/HelloWorld.vue';
import { AuthingGuard } from '@authing/vue-ui-components'
import '@authing/vue-ui-components/lib/index.min.css'

@Component({
  components: {
    HelloWorld,AuthingGuard
  },
})
export default class App extends Vue {}
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
