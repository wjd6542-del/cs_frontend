// @ts-nocheck
import api from "@/api/api";

// 계정·권한 관리 API (material 자재관리 RBAC 참고)
export const adminApi = {
  // user
  userList: (body = {}) => api.post("/user/list", body).then((r) => r.data),
  userCreate: (body) => api.post("/user/create", body).then((r) => r.data),
  userUpdate: (body) => api.post("/user/update", body).then((r) => r.data),
  // role
  roleAllList: () => api.post("/role/allList", {}).then((r) => r.data),
  roleList: () => api.post("/role/list", {}).then((r) => r.data), // permissions 포함
  roleSave: (body) => api.post("/role/save", body).then((r) => r.data),
  rolePermissionSave: (role_id, permission_ids) =>
    api.post("/role/permissionSave", { role_id, permission_ids }).then((r) => r.data),
  // permission
  permissionList: () => api.post("/permission/allList", {}).then((r) => r.data),
};
