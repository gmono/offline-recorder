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
Vue.use(asynccomputed)

// Or you can specify any other name and use it via this.$ls, this.$whatEverYouWant
Vue.use(VueLocalStorage, {
  name: 'ls',
  bind: true //created computed members from your variable declarations
})

new Vue({
  render: h => h(App),
}).$mount('#app')
