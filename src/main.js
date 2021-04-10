import Vue from 'vue'
import App from './App.vue'
import * as Elementui from "element-ui"
import 'element-ui/lib/theme-chalk/index.css';
Vue.config.productionTip = false
Vue.use(Elementui)
import VueFilterDateFormat from '@vuejs-community/vue-filter-date-format';

Vue.use(VueFilterDateFormat);
import VueLocalStorage from 'vue-localstorage'

import asynccomputed from "vue-async-computed"
import './registerServiceWorker'
Vue.use(asynccomputed)
import Vuex from 'vuex'

Vue.use(Vuex)



const store = new Vuex.Store({
  state: {
    count: 0
  },
  mutations: {
    increment(state) {
      state.count++
    }
  }
})

import VueRouter from "vue-router"
import Recorder from "./components/HelloWorld"
//router
Vue.use(VueRouter)
const routes = [
  { path: '/', component: Recorder }
]

// 3. 创建 router 实例，然后传 `routes` 配置
// 你还可以传别的配置参数, 不过先这么简单着吧。
const router = new VueRouter({
  routes // (缩写) 相当于 routes: routes
})

// Or you can specify any other name and use it via this.$ls, this.$whatEverYouWant
Vue.use(VueLocalStorage, {
  name: 'ls',
  bind: true //created computed members from your variable declarations
})

new Vue({
  render: h => h(App),
  store,
  router
}).$mount('#app')
