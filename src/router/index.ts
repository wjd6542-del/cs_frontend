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
import ExchangeRateView from "@/pages/exchange/ExchangeRateView.vue";

import MyPage from "@/pages/mypage/MyPage.vue";
import SettingsView from "@/pages/settings/SettingsView.vue";
import AccountSettings from "@/pages/settings/AccountSettings.vue";
import WhiteIpSettings from "@/pages/settings/WhiteIpSettings.vue";

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
            { path: "ledger", component: LedgerView, meta: { auth: true, title: "장부 관리", perm: "ledger.view" } },
            { path: "settlement/vendor", component: SettlementView, props: { type: "VENDOR" }, meta: { auth: true, title: "업체 정산", perm: "settlement.view" } },
            { path: "settlement/gameco", component: SettlementView, props: { type: "GAME_COMPANY" }, meta: { auth: true, title: "게임사 정산", perm: "settlement.view" } },

            // CS 관리
            { path: "support/:deskCode", component: SupportView, meta: { auth: true, title: "CS 응대", perm: "support.view" } },
            { path: "faq", component: FaqView, meta: { auth: true, title: "자주 하는 질문", perm: "faq.view" } },
            { path: "alerts", component: AlertsView, meta: { auth: true, title: "알림" } },
            { path: "exchange", component: ExchangeRateView, meta: { auth: true, title: "환율 정보" } },

            // 게시판
            { path: "board/:slug", component: BoardView, meta: { auth: true, title: "게시판", perm: "board.view" } },
            { path: "board/:slug/write", component: PostEditView, meta: { auth: true, title: "글쓰기", perm: "board.write" } },
            { path: "post/:id", component: PostDetailView, meta: { auth: true, title: "게시글", perm: "board.view" } },
            { path: "post/:id/edit", component: PostEditView, meta: { auth: true, title: "글 수정", perm: "board.write" } },

            { path: "mypage", component: MyPage, meta: { auth: true, title: "마이페이지" } },
            { path: "account/roles", component: AccountSettings, meta: { auth: true, title: "계정 권한", perm: ["usermanager.view", "permission.user.view"] } },
            { path: "account/whiteip", component: WhiteIpSettings, meta: { auth: true, title: "화이트 아이피", perm: "usermanager.view" } },
            { path: "settings", component: SettingsView, meta: { auth: true, title: "환경설정", perm: ["gameCompany.view", "vendor.view", "permission.menu.view"] } },
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
  // 권한 체크: meta.perm(문자열 또는 배열) 중 하나라도 보유해야 접근 (super는 항상 통과)
  const perm = to.meta.perm as string | string[] | undefined;
  if (perm && auth.user) {
    const codes = Array.isArray(perm) ? perm : [perm];
    if (!codes.some((c) => auth.hasPermission(c))) return "/";
  }
  return true;
});

export default router;
