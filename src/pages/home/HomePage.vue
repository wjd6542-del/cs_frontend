<template>
  <div class="home">
    <!-- 히어로 + 넷플로우 시그니처 -->
    <section class="hero">
      <div class="scan" aria-hidden="true"></div>
      <div class="hero-head">
        <div class="hi">
          <span class="badge-you">PLAYER</span>
          <h1 class="ttl">{{ auth.user?.name || auth.user?.username }}</h1>
          <p class="sub">고객센터 관리 콘솔 · {{ today }}</p>
        </div>
        <div class="mark">CS</div>
      </div>

      <!-- 넷플로우 바 (회수 ▲ vs 지급 ▼) -->
      <div class="flow">
        <div class="flow-row">
          <span class="flow-lbl in">▲ 회수</span>
          <div class="track"><i class="fill in" :style="{ width: barIn + '%' }"></i></div>
          <span class="flow-val in num">{{ won(totals.COLLECTION) }}</span>
        </div>
        <div class="flow-row">
          <span class="flow-lbl out">▼ 지급</span>
          <div class="track"><i class="fill out" :style="{ width: barOut + '%' }"></i></div>
          <span class="flow-val out num">{{ won(totals.PAYMENT) }}</span>
        </div>
        <div class="flow-net">
          <span class="net-lbl">NET (회수−지급)</span>
          <strong class="net-val num" :class="net >= 0 ? 'pos' : 'neg'">{{ won(net) }}</strong>
        </div>
      </div>
    </section>

    <!-- HUD 스탯 -->
    <div class="stats">
      <router-link to="/ledger" class="stat">
        <span class="s-ic in"><i class="fa-solid fa-arrow-down-long"></i></span>
        <div><span class="s-lbl">이번 달 회수</span><strong class="s-val in num">{{ won(totals.COLLECTION) }}</strong></div>
      </router-link>
      <router-link to="/ledger" class="stat">
        <span class="s-ic out"><i class="fa-solid fa-arrow-up-long"></i></span>
        <div><span class="s-lbl">이번 달 지급</span><strong class="s-val out num">{{ won(totals.PAYMENT) }}</strong></div>
      </router-link>
      <router-link to="/settlement/vendor" class="stat">
        <span class="s-ic warn"><i class="fa-solid fa-hourglass-half"></i></span>
        <div><span class="s-lbl">미정산</span><strong class="s-val num">{{ pendingCount }}<em>건</em></strong></div>
      </router-link>
      <router-link to="/support/vendor" class="stat">
        <span class="s-ic acc"><i class="fa-solid fa-headset"></i></span>
        <div><span class="s-lbl">진행중 응대</span><strong class="s-val num">{{ openTickets }}<em>건</em></strong></div>
      </router-link>
    </div>

    <!-- CS 상황판 : 항목별 미해결(접수·처리중) 문의 최근 5건 -->
    <section class="csboard pcard">
      <div class="cb-head">
        <h2 class="cb-ttl"><i class="fa-solid fa-satellite-dish"></i> CS 상황판</h2>
        <span class="cb-sub">항목별 미해결 문의 · 최근 5건</span>
      </div>
      <div class="cb-cols">
        <div v-for="p in CS_PARTIES" :key="p.key" class="cb-col">
          <div class="cbc-head">
            <span class="cbc-name"><i :class="p.icon"></i> {{ p.label }}</span>
            <div class="cbc-chips">
              <span class="chip open">접수 <em>{{ progress[p.key].open }}</em></span>
              <span class="chip prog">처리중 <em>{{ progress[p.key].prog }}</em></span>
            </div>
          </div>
          <ul class="cbc-list">
            <li v-for="t in progress[p.key].rows" :key="t.id" class="cbc-item" :class="'s-' + t.status.toLowerCase()" @click="$router.push(p.to)">
              <span class="st-pill" :class="'st-' + t.status.toLowerCase()">{{ statusLabel(t.status) }}</span>
              <div class="ci-main">
                <span class="ci-title">{{ t.title }}</span>
                <span class="ci-meta">{{ t[p.nameField] || "미지정" }} · {{ fmt(t.created_at) }}</span>
              </div>
              <i v-if="t.priority >= 2" class="ci-flag fa-solid fa-flag" :class="'pr-' + t.priority" title="우선순위 높음"></i>
            </li>
            <li v-if="!progress[p.key].rows.length" class="cbc-empty">
              <EmptyState icon="✅" title="미해결 문의 없음" desc="새 문의가 오면 여기 떠요." hint="청정 상태" compact />
            </li>
          </ul>
          <router-link :to="p.to" class="cbc-more">{{ p.label }} 전체보기 ›</router-link>
        </div>
      </div>
    </section>

    <!-- 공지 + 바로가기 -->
    <div class="cols">
      <section class="notice pcard">
        <div class="nhead">
          <h2 class="nt"><i class="fa-solid fa-bullhorn"></i> 공지사항</h2>
          <router-link v-if="noticeBoard" :to="`/board/${noticeBoard.slug}`" class="more">전체보기 ›</router-link>
        </div>
        <ul class="nlist">
          <li v-for="p in notices" :key="p.id" class="nitem" @click="openPost(p.id)">
            <span v-if="p.is_notice" class="pin">공지</span>
            <span class="npt">{{ p.title }}</span>
            <span class="ndate num">{{ fmt(p.created_at) }}</span>
          </li>
          <li v-if="!notices.length"><EmptyState icon="📭" title="공지가 없어요" desc="등록된 공지사항이 없어요." hint="관리자만 등록할 수 있어요" compact /></li>
        </ul>
      </section>

      <section class="notice pcard">
        <div class="nhead">
          <h2 class="nt"><i class="fa-solid fa-bell"></i> {{ alarmBoard?.name || "알림" }}</h2>
          <router-link v-if="alarmBoard" :to="`/board/${alarmBoard.slug}`" class="more">전체보기 ›</router-link>
        </div>
        <ul class="nlist">
          <li v-for="p in alarmPosts" :key="p.id" class="nitem" @click="openPost(p.id)">
            <span v-if="p.is_notice" class="pin">공지</span>
            <span class="npt">{{ p.title }}</span>
            <span class="ndate num">{{ fmt(p.created_at) }}</span>
          </li>
          <li v-if="!alarmPosts.length"><EmptyState icon="🔔" title="알림이 없어요" desc="등록된 알림 글이 없어요." hint="게시판에서 작성해요" compact /></li>
        </ul>
      </section>
    </div>

    <!-- 공지 모달 -->
    <div v-if="modalPost" class="pmodal" @click.self="modalPost = null">
      <div class="pbox pcard">
        <button class="pclose" @click="modalPost = null"><i class="fa-solid fa-xmark"></i></button>
        <p class="peyebrow">공지사항</p>
        <h3 class="ptitle">{{ modalPost.title }}</h3>
        <div class="pmeta">
          <span>{{ modalPost.user?.name || modalPost.user?.username || "-" }}</span>
          <span class="dot">·</span><span class="num">{{ fmt(modalPost.created_at) }}</span>
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
import EmptyState from "@/components/base/EmptyState.vue";
import { ref, reactive, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { boardApi } from "@/api/board";
import { ledgerApi, settlementApi, supportApi } from "@/api/cs";
import { formatDateDot as fmt } from "@/utils/date";

const auth = useAuthStore();
const noticeBoard = ref(null);
const notices = ref([]);
const alarmBoard = ref(null);
const alarmPosts = ref([]);
const modalPost = ref(null);

const totals = reactive({ PAYMENT: 0, COLLECTION: 0 });
const pendingCount = ref(0);
const openTickets = ref(0);

const CS_PARTIES = [
  { key: "VENDOR", label: "업체 응대", to: "/support/vendor", nameField: "vendor_name", icon: "fa-solid fa-store" },
  { key: "GAME_COMPANY", label: "게임사 응대", to: "/support/gameco", nameField: "game_company_name", icon: "fa-solid fa-gamepad" },
];
const progress = reactive({
  VENDOR: { open: 0, prog: 0, rows: [] },
  GAME_COMPANY: { open: 0, prog: 0, rows: [] },
});
function statusLabel(s) { return { OPEN: "접수", IN_PROGRESS: "처리중" }[s] || s; }

const net = computed(() => totals.COLLECTION - totals.PAYMENT);
const maxFlow = computed(() => Math.max(totals.PAYMENT, totals.COLLECTION, 1));
const barIn = computed(() => Math.round((totals.COLLECTION / maxFlow.value) * 100));
const barOut = computed(() => Math.round((totals.PAYMENT / maxFlow.value) * 100));
const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

function won(n) { return (Number(n) || 0).toLocaleString("ko-KR") + "원"; }
function monthStart() { const dt = new Date(); return new Date(dt.getFullYear(), dt.getMonth(), 1).toISOString().slice(0, 10); }
async function openPost(id) { try { modalPost.value = await boardApi.postGet(id); } catch (e) { /* noop */ } }

onMounted(async () => {
  try {
    noticeBoard.value = await boardApi.get("notice");
    const res = await boardApi.postList(noticeBoard.value.id, 1, 5);
    notices.value = [...(res.notices || []), ...(res.rows || [])].slice(0, 5);
  } catch (e) { /* skip */ }
  try {
    alarmBoard.value = await boardApi.get("alarm");
    const res = await boardApi.postList(alarmBoard.value.id, 1, 5);
    alarmPosts.value = [...(res.notices || []), ...(res.rows || [])].slice(0, 5);
  } catch (e) { /* skip */ }
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
  try {
    await Promise.all(CS_PARTIES.map(async (p) => {
      const [op, pr] = await Promise.all([
        supportApi.list({ party: p.key, status: "OPEN", limit: 5 }),
        supportApi.list({ party: p.key, status: "IN_PROGRESS", limit: 5 }),
      ]);
      const rows = [...(op.rows || []), ...(pr.rows || [])].sort((a, b) => b.id - a.id).slice(0, 5);
      progress[p.key] = { open: op.total || 0, prog: pr.total || 0, rows };
    }));
  } catch (e) { /* skip */ }
});
</script>

<style scoped>
.home { max-width: 1000px; margin: 0 auto; }

/* ── 히어로 콘솔 ── */
.hero { position: relative; overflow: hidden; padding: 1.6rem 1.8rem; color: #e7e8f1; background: radial-gradient(60% 60% at 88% 0%, rgba(122,92,255,0.4), transparent 60%), #16182a; border: 2px solid var(--line-hard); border-radius: 4px; box-shadow: var(--shadow-hard); }
.scan { position: absolute; inset: 0; pointer-events: none; opacity: 0.3; background-image: repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0 2px, transparent 2px 4px); }
.hero-head { position: relative; z-index: 1; display: flex; align-items: flex-start; justify-content: space-between; }
.badge-you { font-family: var(--font-pixel); font-size: 0.6rem; letter-spacing: 0.14em; color: #2fe0c4; }
.ttl { font-family: var(--font-pixel); font-size: 1.7rem; color: #fff; margin-top: 0.25rem; text-shadow: 2px 2px 0 rgba(0,0,0,0.35); }
.sub { font-size: 0.82rem; color: rgba(231,232,241,0.6); margin-top: 0.3rem; }
.mark { width: 52px; height: 52px; display: grid; place-items: center; font-family: var(--font-pixel); font-size: 1.25rem; color: #fff; background: var(--seal); border: 2px solid #0d0e1a; box-shadow: 3px 3px 0 #0d0e1a; }

.flow { position: relative; z-index: 1; margin-top: 1.3rem; display: flex; flex-direction: column; gap: 0.55rem; }
.flow-row { display: flex; align-items: center; gap: 0.7rem; }
.flow-lbl { font-family: var(--font-pixel); font-size: 0.72rem; width: 64px; }
.flow-lbl.in { color: #2fe0c4; } .flow-lbl.out { color: #ffb25e; }
.track { flex: 1; height: 16px; background: rgba(255,255,255,0.08); border: 2px solid #0d0e1a; position: relative; }
.fill { position: absolute; left: 0; top: 0; height: 100%; transition: width 0.5s steps(12); }
.fill.in { background: repeating-linear-gradient(90deg, #12b8a6 0 6px, #0ea88f 6px 8px); }
.fill.out { background: repeating-linear-gradient(90deg, #ff9f1c 0 6px, #e07d16 6px 8px); }
.flow-val { width: 130px; text-align: right; font-size: 0.82rem; }
.flow-val.in { color: #2fe0c4; } .flow-val.out { color: #ffb25e; }
.flow-net { display: flex; align-items: center; justify-content: flex-end; gap: 0.7rem; margin-top: 0.4rem; padding-top: 0.7rem; border-top: 2px solid rgba(122,92,255,0.25); }
.net-lbl { font-family: var(--font-pixel); font-size: 0.66rem; color: rgba(231,232,241,0.6); }
.net-val { font-size: 1.15rem; }
.net-val.pos { color: #2fe0c4; } .net-val.neg { color: #ff8d8d; }

/* ── HUD 스탯 ── */
.stats { margin-top: 1rem; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; }
.stat { display: flex; align-items: center; gap: 0.7rem; padding: 0.9rem; background: var(--surface); border: 2px solid var(--line-hard); border-radius: 4px; box-shadow: var(--shadow-hard); text-decoration: none; transition: transform 0.08s, box-shadow 0.08s; }
.stat:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--line-hard); }
.s-ic { width: 38px; height: 38px; flex-shrink: 0; display: grid; place-items: center; border: 2px solid var(--line-hard); color: #fff; }
.s-ic.in { background: var(--flow-in); } .s-ic.out { background: var(--flow-out); }
.s-ic.warn { background: var(--gold); } .s-ic.acc { background: var(--seal); }
.s-lbl { display: block; font-size: 0.72rem; color: var(--ink-muted); font-weight: 600; }
.s-val { font-size: 1.15rem; color: var(--ink); }
.s-val em { font-style: normal; font-size: 0.8rem; color: var(--ink-muted); margin-left: 1px; }
.s-val.in { color: var(--flow-in); } .s-val.out { color: var(--flow-out); }
@media (max-width: 720px) { .stats { grid-template-columns: repeat(2, 1fr); } }

/* ── CS 상황판 ── */
.csboard { margin-top: 1rem; padding: 1.1rem 1.2rem; }
.cb-head { display: flex; align-items: baseline; gap: 0.6rem; margin-bottom: 0.9rem; }
.cb-ttl { font-family: var(--font-pixel); font-size: 0.98rem; color: var(--ink); display: flex; align-items: center; gap: 0.45rem; }
.cb-ttl i { color: var(--seal); font-size: 0.9rem; }
.cb-sub { font-size: 0.74rem; color: var(--ink-faint); }
.cb-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }
@media (max-width: 720px) { .cb-cols { grid-template-columns: 1fr; } }
.cb-col { display: flex; flex-direction: column; }
.cb-col + .cb-col { border-left: 2px dashed var(--line); padding-left: 1.1rem; }
@media (max-width: 720px) { .cb-col + .cb-col { border-left: none; padding-left: 0; border-top: 2px dashed var(--line); padding-top: 0.9rem; } }

.cbc-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.55rem; }
.cbc-name { font-family: var(--font-pixel); font-size: 0.8rem; color: var(--ink); display: flex; align-items: center; gap: 0.4rem; }
.cbc-name i { color: var(--ink-muted); font-size: 0.78rem; }
.cbc-chips { display: flex; gap: 0.3rem; }
.chip { font-family: var(--font-pixel); font-size: 0.6rem; padding: 0.12rem 0.4rem; border: 1.5px solid var(--line-hard); border-radius: 3px; color: var(--ink-soft); background: #fff; }
.chip em { font-style: normal; font-weight: 700; }
.chip.open { color: #9a5b00; background: #fff3e0; }
.chip.prog { color: var(--seal-deep); background: #ede9ff; }

.cbc-list { display: flex; flex-direction: column; gap: 0.4rem; min-height: 60px; }
.cbc-item { display: flex; align-items: center; gap: 0.55rem; padding: 0.45rem 0.55rem; background: var(--surface); border: 1.5px solid var(--line); border-radius: 3px; border-left-width: 4px; cursor: pointer; transition: transform 0.07s, box-shadow 0.07s, background 0.07s; }
.cbc-item.s-open { border-left-color: var(--flow-out); }
.cbc-item.s-in_progress { border-left-color: var(--seal); }
.cbc-item:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--line-hard); background: var(--surface-2); }
.st-pill { flex-shrink: 0; font-family: var(--font-pixel); font-size: 0.56rem; padding: 0.14rem 0.35rem; border-radius: 3px; border: 1px solid var(--line-hard); color: #fff; }
.st-pill.st-open { background: var(--flow-out); }
.st-pill.st-in_progress { background: var(--seal); }
.ci-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.ci-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.84rem; font-weight: 600; color: var(--ink); }
.ci-meta { font-size: 0.68rem; color: var(--ink-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ci-flag { flex-shrink: 0; font-size: 0.72rem; }
.ci-flag.pr-2 { color: var(--flow-out); }
.ci-flag.pr-3 { color: var(--danger); }
.cbc-empty { padding: 0.3rem 0; }
.cbc-more { margin-top: 0.7rem; font-size: 0.74rem; font-weight: 700; color: var(--ink-muted); text-decoration: none; align-self: flex-start; }
.cbc-more:hover { color: var(--seal); }

/* ── 공지 + 알림 ── */
.cols { margin-top: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }
@media (max-width: 720px) { .cols { grid-template-columns: 1fr; } }
.notice { padding: 1.1rem 1.2rem; }
.nhead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; }
.nt { font-family: var(--font-pixel); font-size: 0.95rem; color: var(--ink); display: flex; align-items: center; gap: 0.5rem; }
.nt i { color: var(--seal); font-size: 0.85rem; }
.more { font-size: 0.78rem; color: var(--ink-muted); text-decoration: none; }
.more:hover { color: var(--seal); }
.nlist { display: flex; flex-direction: column; }
.nitem { display: flex; align-items: center; gap: 0.6rem; padding: 0.55rem 0.1rem; border-bottom: 1px solid var(--line); cursor: pointer; font-size: 0.88rem; }
.nitem:last-child { border-bottom: none; }
.nitem:hover .npt { color: var(--seal); }
.pin { font-family: var(--font-pixel); font-size: 0.6rem; color: var(--seal-deep); background: #ede9ff; padding: 0.1rem 0.35rem; border: 1px solid var(--line-hard); }
.npt { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink); font-weight: 600; }
.ndate { color: var(--ink-faint); font-size: 0.72rem; }
.nempty { color: var(--ink-faint); font-size: 0.86rem; padding: 0.8rem 0.1rem; }


/* ── 모달 ── */
.pmodal { position: fixed; inset: 0; z-index: 220; background: rgba(27,29,46,0.55); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.pbox { position: relative; width: 560px; max-width: 100%; max-height: 85vh; overflow-y: auto; padding: 1.6rem; }
.pclose { position: absolute; top: 1rem; right: 1rem; width: 34px; height: 34px; border: 2px solid var(--line-hard); color: var(--ink); box-shadow: 2px 2px 0 var(--line-hard); }
.pclose:hover { background: var(--surface-2); }
.peyebrow { font-family: var(--font-pixel); font-size: 0.66rem; letter-spacing: 0.12em; color: var(--seal-deep); }
.ptitle { font-family: var(--font-pixel); font-size: 1.2rem; color: var(--ink); margin-top: 0.3rem; }
.pmeta { display: flex; gap: 0.4rem; align-items: center; margin-top: 0.5rem; font-size: 0.8rem; color: var(--ink-muted); padding-bottom: 0.9rem; border-bottom: 2px solid var(--line); }
.pmeta .dot { color: var(--ink-faint); }
.pcontent { padding: 1.1rem 0; font-size: 0.95rem; line-height: 1.75; color: var(--ink-soft); }
.prose :deep(blockquote) { border-left: 3px solid var(--seal); margin: 0.5rem 0; padding: 0.25rem 0.9rem; color: var(--ink-muted); background: var(--surface-2); }
.prose :deep(ul), .prose :deep(ol) { padding-left: 1.4rem; margin: 0.4rem 0; }
.prose :deep(a) { color: var(--seal); text-decoration: underline; }
.prose :deep(img) { max-width: 100%; margin: 0.4rem 0; }
.pfull { display: inline-block; margin-top: 0.6rem; font-size: 0.84rem; font-weight: 700; color: var(--seal); text-decoration: none; }
</style>
