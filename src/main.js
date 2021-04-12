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
import * as _ from "lodash"

//从store中获取一个item 由于带参数难以放在store中 考虑mobx
function getHistoryItem(state,){

}

const store = new Vuex.Store({
  state: {
    countA: 0,
    //当前录音信息
    recording:{
      info:{},
      blobs:[]
    },
    history:{
      //信息表 id->info
      infos:{}
    }
  },
  
  getters:{
    //获取历史列表（idxs)
    historyKeys(state){
      return _.keys(state.history.infos)
    },
  },
  mutations: {
    increment(state) {
      state.countA++
    }
  }
})

import VueRouter from "vue-router"
import Recorder from "./components/HelloWorld"
//router
Vue.use(VueRouter)
import Center from "./components/Center"
const routes = [
  { path: '/', component: Recorder },
  {path:"/center",component:Center}
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
