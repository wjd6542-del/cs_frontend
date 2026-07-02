// @ts-nocheck
import api from "@/api/api";

// 업로드/미디어 origin (VITE_API_URL 에서 /api 제거)
const ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
export function mediaUrl(path) {
  if (!path) return "";
  if (/^https?:/.test(path)) return path;
  return ORIGIN + path;
}

export const boardApi = {
  // board
  list: () => api.post("/board/list", {}).then((r) => r.data),
  listAll: () => api.post("/board/listAll", {}).then((r) => r.data),
  get: (slug) => api.post("/board/get", { slug }).then((r) => r.data),
  save: (body) => api.post("/board/save", body).then((r) => r.data),
  remove: (id) => api.post("/board/delete", { id }).then((r) => r.data),
  // post
  postList: (board_id, cursor = null, take = 20) => api.post("/post/list", { board_id, cursor, take }).then((r) => r.data),
  postGet: (id) => api.post("/post/get", { id }).then((r) => r.data),
  postSave: (body) => api.post("/post/save", body).then((r) => r.data),
  postDelete: (id) => api.post("/post/delete", { id }).then((r) => r.data),
  // comment
  commentAdd: (post_id, content) => api.post("/comment/add", { post_id, content }).then((r) => r.data),
  commentDelete: (id) => api.post("/comment/delete", { id }).then((r) => r.data),
  // upload (multipart)
  upload: (files) => {
    const fd = new FormData();
    for (const f of files) fd.append("file", f);
    return api.post("/upload", fd).then((r) => r.data);
  },
};
