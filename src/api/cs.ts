// @ts-nocheck
import api from "@/api/api";

// 게임사 (환경설정)
export const gameCompanyApi = {
  list: (body = {}) => api.post("/gameCompany/list", body).then((r) => r.data),
  options: () => api.post("/gameCompany/options", {}).then((r) => r.data),
  get: (id) => api.post("/gameCompany/get", { id }).then((r) => r.data),
  save: (body) => api.post("/gameCompany/save", body).then((r) => r.data),
  remove: (id) => api.post("/gameCompany/delete", { id }).then((r) => r.data),
};

// 업체
export const vendorApi = {
  list: (body = {}) => api.post("/vendor/list", body).then((r) => r.data),
  tree: () => api.post("/vendor/tree", {}).then((r) => r.data),
  options: () => api.post("/vendor/options", {}).then((r) => r.data),
  get: (id) => api.post("/vendor/get", { id }).then((r) => r.data),
  save: (body) => api.post("/vendor/save", body).then((r) => r.data),
  remove: (id) => api.post("/vendor/delete", { id }).then((r) => r.data),
};

// 장부 (지급/회수 원장)
export const ledgerApi = {
  list: (body = {}) => api.post("/ledger/list", body).then((r) => r.data),
  save: (body) => api.post("/ledger/save", body).then((r) => r.data),
  remove: (id) => api.post("/ledger/delete", { id }).then((r) => r.data),
};

// 정산 (업체 정산 / 게임사 정산)
export const settlementApi = {
  list: (body = {}) => api.post("/settlement/list", body).then((r) => r.data),
  get: (id) => api.post("/settlement/get", { id }).then((r) => r.data),
  save: (body) => api.post("/settlement/save", body).then((r) => r.data),
  settle: (body) => api.post("/settlement/settle", body).then((r) => r.data),
  remove: (id) => api.post("/settlement/delete", { id }).then((r) => r.data),
};

// CS 응대 (업체 응대 / 게임사 응대)
export const supportApi = {
  list: (body = {}) => api.post("/support/list", body).then((r) => r.data),
  alerts: (body = {}) => api.post("/support/alerts", body).then((r) => r.data),
  get: (id) => api.post("/support/get", { id }).then((r) => r.data),
  save: (body) => api.post("/support/save", body).then((r) => r.data),
  setStatus: (id, status) => api.post("/support/status", { id, status }).then((r) => r.data),
  addMessage: (body) => api.post("/support/message", body).then((r) => r.data),
  remove: (id) => api.post("/support/delete", { id }).then((r) => r.data),
};

// FAQ
export const faqApi = {
  list: (body = {}) => api.post("/faq/list", body).then((r) => r.data),
  categories: () => api.post("/faq/categories", {}).then((r) => r.data),
  get: (id) => api.post("/faq/get", { id }).then((r) => r.data),
  save: (body) => api.post("/faq/save", body).then((r) => r.data),
  remove: (id) => api.post("/faq/delete", { id }).then((r) => r.data),
};

// FAQ 분류 (환경설정)
export const faqCategoryApi = {
  list: (body = {}) => api.post("/faqCategory/list", body).then((r) => r.data),
  save: (body) => api.post("/faqCategory/save", body).then((r) => r.data),
  remove: (id) => api.post("/faqCategory/delete", { id }).then((r) => r.data),
};
