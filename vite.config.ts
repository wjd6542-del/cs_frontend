import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src')
		},
	},
	server: {
		host: true,            // 0.0.0.0 바인딩(외부 접속)
		allowedHosts: true,    // 터널(예: *.trycloudflare.com) 호스트 허용
		proxy: {
			// 프론트와 같은 오리진으로 /api 호출 → 로컬 백엔드로 프록시(단일 URL 터널용)
			'/api': { target: 'http://127.0.0.1:3013', changeOrigin: true },
		},
	},
})