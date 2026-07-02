// @ts-nocheck
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

import RootLayout from "@/layouts/RootLayout.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";
import MainLayout from "@/layouts/MainLayout.vue";

import LoginPage from "@/pages/auth/LoginPage.vue";
import HomePage from "@/pages/home/HomePage.vue";

import BoardView from "@/pages/board/BoardView.vue";
import PostDetailView from "@/pages/board/PostDetailView.vue";
import PostEditView from "@/pages/board/PostEditView.vue";

import LedgerView from "@/pages/ledger/LedgerView.vue";
import SettlementView from "@/pages/settlement/SettlementView.vue";
import SupportView from "@/pages/support/SupportView.vue";
import FaqView from "@/pages/faq/FaqView.vue";
import AlertsView from "@/pages/alerts/AlertsView.vue";

import MyPage from "@/pages/mypage/MyPage.vue";
import SettingsView from "@/pages/settings/SettingsView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: RootLayout,
      children: [
        {
          path: "login",
          component: AuthLayout,
          children: [{ path: "", component: LoginPage }],
        },
        {
          path: "",
          component: MainLayout,
          children: [
            { path: "", component: HomePage, meta: { auth: true, title: "대시보드" } },

            // 지급/회수
            { path: "ledger", component: LedgerView, meta: { auth: true, title: "장부 관리" } },
            { path: "settlement/vendor", component: SettlementView, props: { type: "VENDOR" }, meta: { auth: true, title: "정산 관리" } },
            { path: "settlement/gameco", component: SettlementView, props: { type: "GAME_COMPANY" }, meta: { auth: true, title: "게임사 정산" } },

            // CS 관리
            { path: "support/vendor", component: SupportView, props: { party: "VENDOR" }, meta: { auth: true, title: "업체 응대" } },
            { path: "support/gameco", component: SupportView, props: { party: "GAME_COMPANY" }, meta: { auth: true, title: "게임사 응대" } },
            { path: "faq", component: FaqView, meta: { auth: true, title: "자주 하는 질문" } },
            { path: "alerts", component: AlertsView, meta: { auth: true, title: "알림" } },

            // 게시판
            { path: "board/:slug", component: BoardView, meta: { auth: true, title: "게시판" } },
            { path: "board/:slug/write", component: PostEditView, meta: { auth: true, title: "글쓰기" } },
            { path: "post/:id", component: PostDetailView, meta: { auth: true, title: "게시글" } },
            { path: "post/:id/edit", component: PostEditView, meta: { auth: true, title: "글 수정" } },

            { path: "mypage", component: MyPage, meta: { auth: true, title: "마이페이지" } },
            { path: "settings", component: SettingsView, meta: { auth: true, title: "환경설정" } },
          ],
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!auth.isLoaded) return true;
  if (to.path === "/login") return true;
  if (to.meta.auth && !auth.user) return "/login";
  return true;
});

export default router;
