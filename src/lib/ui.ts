// @ts-nocheck
// 공용 확인/알림 모달 헬퍼 (AlertModal + alert.store 래핑)
import { alertStore } from "@/plugins/alert.store";

/** 삭제 등 위험 동작 확인 — Promise<boolean> */
export function confirmDelete(message, title = "삭제 확인") {
  return alertStore.openConfirm(message, title, "danger");
}

/** 일반 확인 — Promise<boolean> */
export function confirmAsk(message, title = "확인", variant = "info") {
  return alertStore.openConfirm(message, title, variant);
}

/** 단순 알림 */
export function alertMsg(message, title = "알림", variant = "info") {
  return alertStore.openAlert(message, title, variant);
}
