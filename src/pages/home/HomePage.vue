<template>
  <div class="home">
    <section class="hero">
      <div class="hero-txt">
        <p class="eyebrow">CS ERP · 고객센터 관리</p>
        <h1 class="ttl">어서 오세요,<br />{{ auth.user?.name || auth.user?.username }} 님</h1>
        <p class="sub">지급/회수 정산과 업체·게임사 응대를 한 곳에서 관리합니다.</p>
      </div>
      <div class="hero-mark" aria-hidden="true">CS</div>
    </section>

    <!-- 요약 카드 -->
    <div class="stats">
      <router-link to="/ledger" class="stat">
        <span class="slbl">이번 달 회수</span>
        <strong class="sval pos">{{ won(totals.COLLECTION) }}</strong>
        <span class="sfoot">업체 사용대금</span>
      </router-link>
      <router-link to="/ledger" class="stat">
        <span class="slbl">이번 달 지급</span>
        <strong class="sval neg">{{ won(totals.PAYMENT) }}</strong>
        <span class="sfoot">게임사 사용료</span>
      </router-link>
      <router-link to="/settlement/vendor" class="stat">
        <span class="slbl">미정산</span>
        <strong class="sval">{{ pendingCount }}건</strong>
        <span class="sfoot">대기·부분정산</span>
      </router-link>
      <router-link to="/support/vendor" class="stat">
        <span class="slbl">진행중 응대</span>
        <strong class="sval">{{ openTickets }}건</strong>
        <span class="sfoot">접수·처리중</span>
      </router-link>
    </div>

    <!-- 공지사항 -->
    <section class="notice">
      <div class="nhead">
        <h2 class="nt"><i class="fa-solid fa-bullhorn"></i> 공지사항</h2>
        <router-link v-if="noticeBoard" :to="`/board/${noticeBoard.slug}`" class="more">전체보기 ›</router-link>
      </div>
      <ul class="nlist">
        <li v-for="p in notices" :key="p.id" class="nitem" @click="openPost(p.id)">
          <span v-if="p.is_notice" class="pin">공지</span>
          <span class="npt">{{ p.title }}</span>
          <span class="nau">{{ p.author }}</span>
          <span class="ndate">{{ fmt(p.created_at) }}</span>
        </li>
        <li v-if="!notices.length" class="nempty">등록된 공지가 없습니다.</li>
      </ul>
    </section>

    <div class="quick">
      <router-link to="/settlement/vendor" class="qcard"><i class="fa-solid fa-money-bill-transfer"></i><span class="qt">정산 관리</span></router-link>
      <router-link to="/ledger" class="qcard"><i class="fa-solid fa-book"></i><span class="qt">장부 관리</span></router-link>
      <router-link to="/support/vendor" class="qcard"><i class="fa-solid fa-headset"></i><span class="qt">업체 응대</span></router-link>
      <router-link to="/faq" class="qcard"><i class="fa-solid fa-circle-question"></i><span class="qt">FAQ</span></router-link>
    </div>

    <!-- 공지 상세 모달 -->
    <div v-if="modalPost" class="pmodal" @click.self="modalPost = null">
      <div class="pbox">
        <button class="pclose" @click="modalPost = null"><i class="fa-solid fa-xmark"></i></button>
        <p class="peyebrow">공지사항</p>
        <h3 class="ptitle">{{ modalPost.title }}</h3>
        <div class="pmeta">
          <span>{{ modalPost.user?.name || modalPost.user?.username || "-" }}</span>
          <span class="dot">·</span><span>{{ fmt(modalPost.created_at) }}</span>
          <span class="dot">·</span><span>조회 {{ modalPost.view_count }}</span>
        </div>
        <div class="pcontent prose" v-html="modalPost.content"></div>
        <router-link :to="`/post/${modalPost.id}`" class="pfull">게시판에서 열기 ›</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { boardApi } from "@/api/board";
import { ledgerApi, settlementApi, supportApi } from "@/api/cs";
import { formatDateDot as fmt } from "@/utils/date";

const auth = useAuthStore();
const noticeBoard = ref(null);
const notices = ref([]);
const modalPost = ref(null);

const totals = reactive({ PAYMENT: 0, COLLECTION: 0 });
const pendingCount = ref(0);
const openTickets = ref(0);

function won(n) { return (Number(n) || 0).toLocaleString("ko-KR") + "원"; }
function monthStart() { const dt = new Date(); return new Date(dt.getFullYear(), dt.getMonth(), 1).toISOString().slice(0, 10); }

async function openPost(id) {
  try { modalPost.value = await boardApi.postGet(id); } catch (e) { /* noop */ }
}

onMounted(async () => {
  try {
    noticeBoard.value = await boardApi.get("notice");
    const res = await boardApi.postList(noticeBoard.value.id, null, 5);
    notices.value = [...(res.notices || []), ...(res.rows || [])].slice(0, 5);
  } catch (e) { /* 공지판 없으면 skip */ }
  try {
    const led = await ledgerApi.list({ date_from: monthStart(), limit: 1 });
    totals.PAYMENT = led.totals?.PAYMENT || 0;
    totals.COLLECTION = led.totals?.COLLECTION || 0;
  } catch (e) { /* skip */ }
  try {
    const [v, g] = await Promise.all([
      settlementApi.list({ type: "VENDOR", status: "PENDING", limit: 1 }),
      settlementApi.list({ type: "GAME_COMPANY", status: "PENDING", limit: 1 }),
    ]);
    pendingCount.value = (v.total || 0) + (g.total || 0);
  } catch (e) { /* skip */ }
  try {
    const [o, ip] = await Promise.all([
      supportApi.list({ status: "OPEN", limit: 1 }),
      supportApi.list({ status: "IN_PROGRESS", limit: 1 }),
    ]);
    openTickets.value = (o.total || 0) + (ip.total || 0);
  } catch (e) { /* skip */ }
});
</script>

<style scoped>
.home { max-width: 980px; margin: 0 auto; }

.hero {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 1.8rem 2.2rem; border-radius: 18px; color: #e2e8f0; overflow: hidden;
  background: radial-gradient(120% 120% at 90% 0%, #334155 0%, transparent 55%), linear-gradient(150deg, #1e293b 0%, #0f172a 70%);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.2);
}
.hero-txt { min-width: 0; }
.hero-mark { flex-shrink: 0; width: 92px; height: 92px; display: grid; place-items: center; border-radius: 20px; font-weight: 800; font-size: 1.9rem; letter-spacing: -1px; color: #fff; background: linear-gradient(145deg, #6366f1, #4f46e5 55%, #4338ca); box-shadow: 0 10px 24px rgba(79, 70, 229, 0.4); }
.eyebrow { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.2em; color: #a5b4fc; text-transform: uppercase; }
.ttl { margin-top: 0.4rem; font-size: 1.5rem; font-weight: 800; line-height: 1.25; color: #f1f5f9; }
.sub { margin-top: 0.4rem; font-size: 0.88rem; color: rgba(226, 232, 240, 0.72); }

.stats { margin-top: 1.25rem; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.9rem; }
.stat { display: flex; flex-direction: column; gap: 0.25rem; padding: 1.1rem; border-radius: 14px; background: var(--surface); border: 1px solid var(--line); text-decoration: none; transition: transform 0.12s, box-shadow 0.15s; }
.stat:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.slbl { font-size: 0.76rem; color: var(--ink-muted); font-weight: 600; }
.sval { font-size: 1.4rem; font-weight: 800; color: var(--ink); }
.sval.pos { color: #059669; } .sval.neg { color: #dc2626; }
.sfoot { font-size: 0.72rem; color: var(--ink-faint); }
@media (max-width: 640px) { .stats { grid-template-columns: repeat(2, 1fr); } }

.notice { margin-top: 1.25rem; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 1.2rem 1.3rem; }
.nhead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.7rem; }
.nt { font-weight: 700; color: var(--ink); display: flex; align-items: center; gap: 0.5rem; }
.nt i { color: var(--seal); font-size: 0.9rem; }
.more { font-size: 0.8rem; color: var(--ink-muted); text-decoration: none; }
.more:hover { color: var(--seal); }
.nlist { display: flex; flex-direction: column; }
.nitem { display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.2rem; border-bottom: 1px solid var(--line); cursor: pointer; font-size: 0.9rem; }
.nitem:last-child { border-bottom: none; }
.nitem:hover .npt { color: var(--seal); }
.pin { font-size: 0.66rem; font-weight: 700; color: var(--seal); background: #e0e7ff; padding: 0.05rem 0.4rem; border-radius: 999px; }
.npt { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink); font-weight: 600; }
.nau { color: var(--ink-muted); font-size: 0.8rem; }
.ndate { color: var(--ink-faint); font-size: 0.78rem; }
.nempty { color: var(--ink-faint); font-size: 0.86rem; padding: 0.8rem 0.2rem; }

.quick { margin-top: 1.25rem; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.9rem; }
@media (max-width: 640px) { .quick { grid-template-columns: repeat(2, 1fr); } }
.qcard { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1.1rem; border-radius: 14px; background: var(--surface); border: 1px solid var(--line); text-decoration: none; transition: transform 0.12s, box-shadow 0.15s; }
.qcard:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.qcard i { font-size: 1.15rem; color: var(--seal); }
.qt { font-weight: 700; font-size: 0.95rem; color: var(--ink); }

.pmodal { position: fixed; inset: 0; z-index: 220; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.pbox { position: relative; width: 560px; max-width: 100%; max-height: 85vh; overflow-y: auto; background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 1.6rem; box-shadow: var(--shadow-lg); }
.pclose { position: absolute; top: 1rem; right: 1rem; width: 34px; height: 34px; border-radius: 9px; color: var(--ink-muted); }
.pclose:hover { background: var(--surface-2); color: var(--ink); }
.peyebrow { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.15em; color: var(--seal); }
.ptitle { font-size: 1.3rem; font-weight: 800; color: var(--ink); margin-top: 0.3rem; }
.pmeta { display: flex; gap: 0.4rem; align-items: center; margin-top: 0.5rem; font-size: 0.8rem; color: var(--ink-muted); padding-bottom: 0.9rem; border-bottom: 1px solid var(--line); }
.pmeta .dot { color: var(--ink-faint); }
.pcontent { padding: 1.1rem 0; font-size: 0.95rem; line-height: 1.75; color: var(--ink-soft); }
.prose :deep(blockquote) { border-left: 3px solid var(--seal); margin: 0.5rem 0; padding: 0.25rem 0.9rem; color: var(--ink-muted); background: var(--surface-2); border-radius: 0 8px 8px 0; }
.prose :deep(ul), .prose :deep(ol) { padding-left: 1.4rem; margin: 0.4rem 0; }
.prose :deep(a) { color: var(--seal); text-decoration: underline; }
.prose :deep(img) { max-width: 100%; border-radius: 8px; margin: 0.4rem 0; }
.pfull { display: inline-block; margin-top: 0.6rem; font-size: 0.84rem; font-weight: 600; color: var(--seal); text-decoration: none; }
</style>
