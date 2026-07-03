/// <reference types="vite/client" />

declare module "*.vue" {
	import { DefineComponent } from "vue"
	const component: DefineComponent<{}, {}, any>
	export default component
}

// 전역 $t (다국어) 타입 선언
declare module "vue" {
	interface ComponentCustomProperties {
		$t: (key: string) => string
	}
}