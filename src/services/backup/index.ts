import type { PlannerData } from '../../features/planner/types';
import { parseDate, validTime } from '../../utils/date';
export interface Backup extends PlannerData {
  version: 1;
  exportedAt: string;
}
function record(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v))
    throw new Error('백업 객체가 올바르지 않습니다.');
  return v as Record<string, unknown>;
}
function text(v: unknown): asserts v is string {
  if (typeof v !== 'string') throw new Error('문자열 필드가 올바르지 않습니다.');
}
function id(v: unknown): asserts v is string {
  text(v);
  if (!v || v.length > 200) throw new Error('ID가 올바르지 않습니다.');
}
function date(v: unknown): void {
  text(v);
  parseDate(v);
}
function list(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v) || v.length > 500000) throw new Error('배열이 올바르지 않습니다.');
  return v.map(record);
}
function unique(values: string[]): void {
  if (new Set(values).size !== values.length) throw new Error('중복된 식별자가 있습니다.');
}
export function validateData(input: unknown): PlannerData {
  const root = record(input);
  const daily = list(root.dailyPlanItems);
  const recurring = list(root.recurringPlans);
  const exceptions = list(root.recurringPlanExceptions);
  const orders = list(root.dailyPlanOrders);
  const overrides = list(root.holidayOverrides ?? []);
  const settings = record(root.settings ?? { theme: 'system' });
  if (typeof settings.theme !== 'string' || !['system', 'light', 'dark'].includes(settings.theme))
    throw new Error('테마가 올바르지 않습니다.');
  for (const p of daily) {
    id(p.id);
    date(p.date);
    text(p.content);
    text(p.createdAt);
    if (!/^\d{4}-\d{2}-\d{2}T/.test(p.createdAt) || !Number.isFinite(Date.parse(p.createdAt)))
      throw new Error('작성 시간이 올바르지 않습니다.');
  }
  for (const p of recurring) {
    id(p.id);
    text(p.title);
    if (!p.title.trim() || !validTime(p.time))
      throw new Error('반복 일정 제목 또는 시간이 올바르지 않습니다.');
    date(p.startDate);
    if (p.endDate !== null) {
      date(p.endDate);
      if (String(p.endDate) < String(p.startDate)) throw new Error('종료일이 시작일보다 이릅니다.');
    }
    if (
      typeof p.holidayPolicy !== 'string' ||
      !['include', 'exclude', 'only'].includes(p.holidayPolicy)
    )
      throw new Error('공휴일 정책이 올바르지 않습니다.');
    if (
      !Array.isArray(p.weekdays) ||
      p.weekdays.some((d) => !Number.isInteger(d) || d < 0 || d > 6) ||
      new Set(p.weekdays).size !== p.weekdays.length ||
      (p.holidayPolicy !== 'only' && p.weekdays.length === 0)
    )
      throw new Error('요일이 올바르지 않습니다.');
  }
  unique(daily.map((p) => String(p.id)));
  unique(recurring.map((p) => String(p.id)));
  const recurringIds = new Set(recurring.map((p) => p.id));
  for (const e of exceptions) {
    id(e.recurringPlanId);
    date(e.date);
    if (!recurringIds.has(e.recurringPlanId) || typeof e.cancelled !== 'boolean')
      throw new Error('반복 예외가 올바르지 않습니다.');
    if (e.title !== undefined) {
      text(e.title);
      if (!e.title.trim()) throw new Error('예외 제목이 비어 있습니다.');
    }
    if (e.time !== undefined && !validTime(e.time))
      throw new Error('예외 시간이 올바르지 않습니다.');
  }
  unique(exceptions.map((e) => JSON.stringify([e.recurringPlanId, e.date])));
  for (const o of orders) {
    date(o.date);
    if (
      !Array.isArray(o.itemIds) ||
      o.itemIds.some((v) => typeof v !== 'string' || !/^(daily|recurring):.+$/.test(v))
    )
      throw new Error('정렬 데이터가 올바르지 않습니다.');
    unique(o.itemIds as string[]);
  }
  unique(orders.map((o) => String(o.date)));
  for (const o of overrides) {
    date(o.date);
    if (o.name !== null) {
      text(o.name);
      if (!o.name.trim()) throw new Error('공휴일 이름이 비어 있습니다.');
    }
  }
  unique(overrides.map((o) => String(o.date)));
  // Copy only known fields so arbitrary backup properties cannot enter persisted state.
  return {
    dailyPlanItems: daily.map((p) => ({
      id: p.id,
      date: p.date,
      content: p.content,
      createdAt: p.createdAt,
    })),
    recurringPlans: recurring.map((p) => ({
      id: p.id,
      title: p.title,
      time: p.time,
      startDate: p.startDate,
      endDate: p.endDate,
      weekdays: p.weekdays,
      holidayPolicy: p.holidayPolicy,
    })),
    recurringPlanExceptions: exceptions.map((e) => ({
      recurringPlanId: e.recurringPlanId,
      date: e.date,
      cancelled: e.cancelled,
      ...(e.title !== undefined ? { title: e.title } : {}),
      ...(e.time !== undefined ? { time: e.time } : {}),
    })),
    dailyPlanOrders: orders.map((o) => ({ date: o.date, itemIds: o.itemIds })),
    settings: { theme: settings.theme },
    holidayOverrides: overrides.map((o) => ({ date: o.date, name: o.name })),
  } as PlannerData;
}
export function parseBackup(json: string): PlannerData {
  if (json.length > 50 * 1024 * 1024) throw new Error('백업 파일은 50MB 이하여야 합니다.');
  const root = record(JSON.parse(json));
  if (root.version !== 1) throw new Error('지원하지 않는 백업 버전입니다.');
  text(root.exportedAt);
  if (!Number.isFinite(Date.parse(root.exportedAt)))
    throw new Error('백업 생성 시간이 올바르지 않습니다.');
  // Version 1 is the first released format. Missing optional v1 settings use defaults.
  return validateData(root);
}
export function createBackup(data: PlannerData): string {
  return JSON.stringify(
    { version: 1, exportedAt: new Date().toISOString(), ...validateData(data) },
    null,
    2,
  );
}
