// @ts-nocheck
﻿import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { router } from "@/router";


const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	timeout: 10000,
	headers: {
		"X-Client-Type": "web",
		"x-api-key": import.meta.env.VITE_API_KEY,
	},
});

// 요청 인터셉터: 저장된 토큰을 Authorization 헤더에 주입한다
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// 응답 인터셉터 (공통 에러)
api.interceptors.response.use(
	(res) => res,
	(err) => {
		if (err.response?.status === 401) {
			useAuthStore().logout();
			if (router.currentRoute.value.path !== "/login") {
				router.replace({
					path: "/login",
					query: { redirect: router.currentRoute.value.fullPath },
				});
			}
		}

		console.error("API ERROR", err.response || err);
		return Promise.reject(err.response?.data ?? err);
	},
);

export default api;