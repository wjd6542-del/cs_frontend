// @ts-nocheck
// 날짜 포맷 / 범위 계산 유틸 모음

export type DateInput = Date | string | number | null | undefined;

export interface DateRange {
  start: Date;
  end: Date;
}

const pad2 = (n: number): string => String(n).padStart(2, "0");

// 입력값을 안전하게 Date 로 변환. 잘못된 입력은 null 반환
function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// YYYY.MM.DD 문자열 (표시용, 잘못된 입력 시 "")
export function formatDateDot(value: DateInput): string {
  const d = toDate(value);
  if (!d) return "";
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
}

// YYYY.MM.DD HH:mm 문자열 (표시용, 분까지, 잘못된 입력 시 "")
export function formatDateDotMinute(value: DateInput): string {
  const d = toDate(value);
  if (!d) return "";
  return (
    `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} ` +
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  );
}

// YYYY-MM-DD 문자열로 포맷팅한다 (잘못된 입력 시 "-")
export function formatDateOnly(value: DateInput): string {
  const d = toDate(value);
  if (!d) return "-";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// YYYY-MM-DD HH:mm:ss 문자열로 포맷팅한다 (잘못된 입력 시 "-")
export function formatDateTime(value: DateInput): string {
  const d = toDate(value);
  if (!d) return "-";
  return (
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ` +
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
  );
}

// YYYYMMDD_HHmmss 형태의 파일명용 타임스탬프 (구분자 없음)
export function formatTimestamp(value: DateInput = new Date()): string {
  const d = toDate(value);
  if (!d) return "";
  return (
    `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}_` +
    `${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`
  );
}

// YYYY-MM-DD HH:mm 문자열로 포맷팅한다 (분까지)
export function formatDateMinute(value: DateInput): string {
  const d = toDate(value);
  if (!d) return "-";
  return (
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ` +
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  );
}

// 주어진 Date 의 시각을 00:00:00.000 으로 변경한 새 Date 반환
export function startOfDay(date: DateInput): Date {
  const d = new Date(date as any);
  d.setHours(0, 0, 0, 0);
  return d;
}

// 주어진 Date 의 시각을 23:59:59.999 으로 변경한 새 Date 반환
export function endOfDay(date: DateInput): Date {
  const d = new Date(date as any);
  d.setHours(23, 59, 59, 999);
  return d;
}

// 오늘 00:00 ~ 23:59 범위 객체
export function todayRange(): DateRange {
  const now = new Date();
  return { start: startOfDay(now), end: endOfDay(now) };
}

// 어제 00:00 ~ 23:59 범위
export function yesterdayRange(): DateRange {
  const start = startOfDay(new Date());
  start.setDate(start.getDate() - 1);
  const end = endOfDay(start);
  return { start, end };
}

// 최근 7일 (오늘 포함) 범위
export function lastWeekRange(): DateRange {
  const start = startOfDay(new Date());
  start.setDate(start.getDate() - 7);
  return { start, end: endOfDay(new Date()) };
}

// 이번 달 첫날 ~ 마지막날 범위
export function currentMonthRange(): DateRange {
  const now = new Date();
  return {
    start: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}