// @ts-nocheck
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import pinia from "./stores/pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

import Toast, { useToast } from "vue-toastification";
import "vue-toastification/dist/index.css";

import "@fortawesome/fontawesome-free/css/all.min.css";
import "./assets/tailwind.css";

import VueECharts from "vue-echarts";
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import { TooltipComponent, GridComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
echarts.use([BarChart, LineChart, PieChart, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer]);

import AlertPlugin from "@/plugins/alert.plugin";

const app = createApp(App);

app.use(AlertPlugin);
app.use(pinia);
pinia.use(piniaPluginPersistedstate);
app.use(Toast, {
  position: "top-right",
  timeout: 2000,
  closeOnClick: true,
  pauseOnHover: true,
});
app.config.globalProperties.$toast = useToast();
app.use(router);
app.component("v-chart", VueECharts);
app.mount("#app");
