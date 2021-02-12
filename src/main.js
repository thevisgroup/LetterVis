import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);
import store from "./store";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import App from "./App.vue";
import router from "./router";

import BackToTop from "vue-backtotop";
Vue.use(BackToTop);

import VueSplit from "vue-split-panel";
Vue.use(VueSplit);

Vue.use(BootstrapVue);
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVueIcons);

import ViserVue from "viser-vue";
Vue.use(ViserVue);

import PerfectScrollbar from "vue2-perfect-scrollbar";
import "vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css";
Vue.use(PerfectScrollbar);

import VueWaypoint from "vue-waypoint";
Vue.use(VueWaypoint);

import VueScrollTo from "vue-scrollto";
Vue.use(VueScrollTo);

Vue.use(VueScrollTo, {
  container: "body",
  duration: 500,
  easing: "ease",
  offset: 0,
  force: true,
  cancelable: true,
  onStart: false,
  onDone: false,
  onCancel: false,
  x: false,
  y: true,
});

import { library } from "@fortawesome/fontawesome-svg-core";
import { faChevronUp, faChevronDown, faMars, faVenus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faChevronUp, faChevronDown, faMars, faVenus);

Vue.component("icon", FontAwesomeIcon);

import ThumbnailView from "./components/ThumbnailView.vue";
Vue.component("ThumbnailView", ThumbnailView);

import FocusView from "./components/FocusView.vue";
Vue.component("FocusView", FocusView);

import CentroidView from "./components/CentroidView.vue";
Vue.component("CentroidView", CentroidView);

import MatrixView from "./components/MatrixView.vue";
Vue.component("MatrixView", MatrixView);

import ChainView from "./components/ChainView.vue";
Vue.component("ChainView", ChainView);

Vue.config.productionTip = false;

new Vue({
  el: "#app",
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
