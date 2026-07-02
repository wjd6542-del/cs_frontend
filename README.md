# cs-frontend

고객센터 관리용 ERP **cs** 의 웹 프론트엔드. 회사는 중간 판매자로서 게임사에 사용료를 지급하고, 업체로부터 사용대금을 회수한다. (족보 시스템 `generation-frontend` 기반 포팅)

## 기술 스택

- **Vue 3 + Vite 5** (`<script setup>`)
- **Pinia** 상태관리, **Vue Router**
- **Tailwind CSS 3** — slate/indigo 전문 ERP 테마
- **ECharts**(vue-echarts) 대시보드 차트
- **vue-toastification** 토스트

## 구조

- `src/pages/` — 화면
  - `home/` 대시보드 · `ledger/` 장부 관리 · `settlement/` 정산(업체/게임사) · `support/` 응대(업체/게임사) · `faq/` FAQ · `board/` 게시판 · `settings/` 환경설정 · `mypage/` 마이페이지
- `src/components/base/` — 공용 컴포넌트 (BaseInput·SearchSelect·BaseModal·BaseTable·RichEditor 등)
- `src/api/` — 백엔드 호출 래퍼 (`cs.ts` = 게임사·업체·장부·정산·응대·FAQ)
- `src/stores/` — Pinia 스토어 (auth 권한 포함)
- `src/assets/tailwind.css` — 디자인 토큰·전역 스타일

## 메뉴

- **지급/회수**: 정산 관리(업체 회수) · 장부 관리 · 게임사 정산(지급)
- **CS 관리**: 업체 응대 · 게임사 응대 · 자주 하는 질문
- **게시판**, **환경설정**(게임사·업체·게시판·계정/권한)

## 시작하기

```bash
npm install
cp .env.example .env      # VITE_API_URL, VITE_API_KEY 설정
npm run dev               # 백엔드가 3003 포트에서 떠 있어야 함
npm run build             # vue-tsc 타입체크 + vite build → dist/
```

백엔드는 [cs_server](https://github.com/wjd6542-del/cs_server) 참고.

## 환경변수

| 키 | 설명 |
|---|---|
| `VITE_API_URL` | 백엔드 API 베이스 URL (끝에 `/api` 포함, 예: `http://localhost:3003/api`) |
| `VITE_API_KEY` | 백엔드 `x-api-key` (서버 `API_KEY`와 동일) |
