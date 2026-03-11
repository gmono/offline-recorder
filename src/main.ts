import Vue from "vue";
import VueFilterDateFormat from "@vuejs-community/vue-filter-date-format";
import VueLocalStorage from "vue-localstorage";
import asynccomputed from "vue-async-computed";
import Vuex from "vuex";
import VueRouter from "vue-router";
import mavonEditor from "mavon-editor";
import VueMq from "vue-mq";
import VueI18n from "vue-i18n";
import * as brofs from "browserfs";

import App from "./Main.vue";
import getStore from "./store";
import RecorderStudio from "./components/RecorderStudio.vue";
import { feedbackPlugin } from "@/ui/feedback";
import { bootstrapAds } from "@/libs/ads/bootstrap";

import "./styles/uno.css";
import "./styles/theme.css";
import "mavon-editor/dist/css/index.css";
import "./registerServiceWorker";

Vue.config.productionTip = false;

Vue.use(VueFilterDateFormat);
Vue.use(asynccomputed);
Vue.use(Vuex);
Vue.use(VueRouter);
Vue.use(VueI18n);
Vue.use(mavonEditor);
Vue.use(feedbackPlugin);
Vue.use(VueMq, {
  breakpoints: {
    sm: 450,
    md: 950,
    lg: Infinity,
  },
  defaultBreakpoint: "sm",
});
Vue.use(VueLocalStorage, {
  name: "ls",
  bind: true,
});

const store = getStore();

const router = new VueRouter({
  routes: [
    { path: "/", component: RecorderStudio },
    { path: "/new", component: RecorderStudio },
    { path: "*", redirect: "/" },
  ],
});

const ele = document.getElementById("cont");

brofs.install(window);
brofs.configure(
  {
    fs: brofs.FileSystem.IndexedDB.Name,
    options: {},
  },
  function(e) {
    if (e) {
      throw e;
    }

    // 初始化广告系统（根据 .env 中的 key 自动注册可用平台）
    bootstrapAds().catch((err) => console.warn('[AdBootstrap] 初始化失败:', err));

    new Vue({
      render: (h) => h(App),
      store,
      router,
      el: ele,
    });
  }
);
