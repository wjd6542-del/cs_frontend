// @ts-nocheck
﻿import { alertStore } from "./alert.store";

export default {
  // 전역 $alert/$confirm 프로퍼티를 Vue 앱에 등록한다
  install(app) {
    app.config.globalProperties.$alert = alertStore.openAlert.bind(alertStore);
    app.config.globalProperties.$confirm =
      alertStore.openConfirm.bind(alertStore);
  },
};