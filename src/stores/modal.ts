// @ts-nocheck
import { defineStore } from "pinia"
import { ref, computed, markRaw } from "vue"
import type { Component } from "vue"

type ModalEntry = {
	component: Component
	props: Record<string, any>
	size: string
}

export const useModalStore = defineStore("modal", () => {

	// 모달 스택: 가장 마지막 요소가 최상단에 렌더링된다
	const stack = ref<ModalEntry[]>([])

	// 현재 모달이 하나라도 열려있는지 여부
	const isOpen = computed(() => stack.value.length > 0)

	// 스택 최상단 모달 정보 (하위 호환용)
	const component = computed(() => stack.value.at(-1)?.component ?? null)
	const props = computed(() => stack.value.at(-1)?.props ?? {})
	const size = computed(() => stack.value.at(-1)?.size ?? "md")

	// 컴포넌트/props/사이즈를 받아 스택에 새 모달을 쌓는다
	function openModal (comp: Component, compProps: Record<string, any> = {}, modalSize = "md") {
		stack.value.push({
			component: markRaw(comp) as Component,
			props: compProps,
			size: modalSize,
		})
	}

	// 최상단 모달만 닫는다 (스택에 하위 모달이 있으면 유지)
	function closeModal () {
		stack.value.pop()
	}

	// 모든 모달을 닫는다
	function closeAll () {
		stack.value = []
	}

	return {
		stack,
		isOpen,
		component,
		props,
		size,
		openModal,
		closeModal,
		closeAll,
	}

})