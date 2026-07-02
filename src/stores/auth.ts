// @ts-nocheck
﻿import { defineStore } from "pinia"
import { jwtDecode } from "jwt-decode"

interface AuthState {
	token: string | null
	user: User | null
	isLoaded: boolean
}

interface User {
	id: number
	username: string
	name: string
	email?: string

	role?: {
		id: number
		name: string
	}

	is_super: boolean

	// 🔥 권한 배열
	permissions: string[]
}

interface LoginResponse {
	token: string
	user: User
}

export const useAuthStore = defineStore("auth", {

	state: (): AuthState => ({
		token: null,
		user: null,
		isLoaded: false
	}),

	getters: {

		// 토큰 존재 여부로 로그인 상태를 반환한다
		isLogin: (state): boolean => {
			return !!state.token
		},

		// 🔥 권한 체크 (슈퍼 관리자 포함)
		// 특정 권한 코드 보유 여부를 반환한다 (super는 항상 true)
		hasPermission: (state) => {
			return (code?: string) => {
				// ❌ user 없으면 차단
				if (!state.user) return false

				// 🔥 super admin (전체 허용)
				if (state.user.is_super) return true

				// ✅ permission 없는 경우 허용
				if (!code) return true

				const permissions = state.user.permissions || []
				return permissions.includes(code)
			}
		}

	},

	actions: {

		// JWT 토큰의 만료 여부를 검사하고 만료 시 로그아웃 처리한다
		checkToken () {
			const token = this.token
			if (!token) return false

			try {
				const decoded: any = jwtDecode(token)
				const now = Date.now() / 1000

				if (decoded.exp < now) {
					this.logout()
					return false
				}

				return true
			} catch (e) {
				this.logout()
				return false
			}
		},

		// 로그인 성공 응답을 받아 상태와 로컬스토리지에 저장한다
		login (data: LoginResponse) {
			this.token = data.token
			this.user = data.user
			this.isLoaded = true

			localStorage.setItem("token", data.token)
			localStorage.setItem("user", JSON.stringify(data.user))
		},

		// 로그아웃 처리 및 로컬스토리지 토큰/유저 정보를 제거한다
		logout () {
			this.token = null
			this.user = null
			this.isLoaded = true

			localStorage.removeItem("token")
			localStorage.removeItem("user")
		},

		// 로컬스토리지의 토큰과 유저 정보를 복원하고 만료 시 로그아웃한다
		restore () {
			const token = localStorage.getItem("token")
			const user = localStorage.getItem("user")

			if (!token || !user) {
				this.isLoaded = true
				return
			}

			this.token = token
			this.user = JSON.parse(user)

			// 🔥 토큰 만료 체크
			try {
				const decoded: any = jwtDecode(token)
				const now = Date.now() / 1000

				if (decoded.exp < now) {
					this.logout()
					return
				}
			} catch (e) {
				this.logout()
				return
			}

			this.isLoaded = true
		}

	},

	persist: true,
})