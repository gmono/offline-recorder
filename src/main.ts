import Vue from "vue";
import App from "./Main.vue";
// import App from "./components/HelloWorld.vue";
import * as Elementui from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
Vue.config.productionTip = false;
Vue.use(Elementui);

import Vant from "vant";
import "vant/lib/index.css";

Vue.use(Vant);

import VueFilterDateFormat from "@vuejs-community/vue-filter-date-format";

Vue.use(VueFilterDateFormat);
import VueLocalStorage from "vue-localstorage";

import asynccomputed from "vue-async-computed";
import "./registerServiceWorker";
Vue.use(asynccomputed);
import Vuex from "vuex";

Vue.use(Vuex);
import * as _ from "lodash";

//从store中获取一个item 由于带参数难以放在store中 考虑mobx
function getHistoryItem(state) {}

import getStore from "./store";

const store = getStore();
import VueRouter from "vue-router";
import Recorder from "./components/HelloWorld.vue";
import NewRecorder from "./components/NewRecorder.vue";
//router
Vue.use(VueRouter);
import Center from "./components/Center.vue";
import Login from "./components/Login.vue";
const routes = [
  { path: "/login", component: Login },
  { path: "/", component: Recorder },
  { path: "/center", component: Center },
  { path: "/new", component: NewRecorder },
];

// 3. 创建 router 实例，然后传 `routes` 配置
// 你还可以传别的配置参数, 不过先这么简单着吧。
const router = new VueRouter({
  routes, // (缩写) 相当于 routes: routes
});

// Or you can specify any other name and use it via this.$ls, this.$whatEverYouWant
Vue.use(VueLocalStorage, {
  name: "ls",
  bind: true, //created computed members from your variable declarations
});

import mavonEditor from "mavon-editor";
import "mavon-editor/dist/css/index.css";
// use
Vue.use(mavonEditor);

import VueMq from "vue-mq";

import VueI18n from "vue-i18n";

Vue.use(VueI18n);
Vue.use(VueMq, {
  breakpoints: {
    // default breakpoints - customize this
    sm: 450,
    md: 950,
    lg: Infinity,
  },
  defaultBreakpoint: "sm", // customize this for SSR
});

const ele = document.getElementById("cont");

import * as brofs from "browserfs";

brofs.install(window);
// Configures BrowserFS to use the LocalStorage file system.
//注意 切换文件系统会导致之前录制的看不到，但修改回来 就可以 数据不会丢失
brofs.configure(
  {
    fs: brofs.FileSystem.IndexedDB.Name,
    options: {},
  },
  function(e) {
    if (e) {
      // An error happened!
      throw e;
    }
    // Otherwise, BrowserFS is ready-to-use!
    new Vue({
      render: (h) => h(App),
      // render:h=>h("div",["helloworld"]),
      store,
      router,
      el: ele,
    });
  }
);
