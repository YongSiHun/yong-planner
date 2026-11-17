import { memoExpired } from '../../notes/services/trash';
import { memoFields } from '../../notes/services/memo';
import type { HolidayService } from '../../../services/holiday';
import type { DailyPlanItem, PlannerData, RecurringPlan, RecurringPlanException } from '../types';
import { recurringEntry } from './recurrence';

export interface SearchResult {
  key: string;
  date: string;
  content: string;
  time: string | null;
  kind: 'daily' | 'recurring' | 'exception' | 'memo' | 'trash';
  memoId?: string;
  recurringId?: string;
  endDate?: string | null;
}

export function searchPlans(
  data: PlannerData,
  query: string,
  holidays: HolidayService,
): SearchResult[] {
  const needle = query.trim().toLocaleLowerCase('ko-KR');
  const empty = needle.length === 0;

  if (empty) {
    return [];
  }
  const matches = (text: string) => text.toLocaleLowerCase('ko-KR').includes(needle);
  const daily = data.dailyPlanItems.filter((item) => matches(item.content)).map(dailyResult);
  // A recurring series is one result with its full period, including open-ended series.
  const recurring = data.recurringPlans.filter((plan) => matches(plan.title)).map(recurringResult);
  const plans = new Map(data.recurringPlans.map((plan) => [plan.id, plan]));
  const exceptions = data.recurringPlanExceptions
    .flatMap((exception) => exceptionResult(exception, plans, holidays))
    .filter((result) => matches(result.content));

  const memos: SearchResult[] = (data.memos ?? [])
    .filter((memo) => !memoExpired(memo) && matches((memo.title ?? '') + '\n' + memo.content))
    .map((memo) => {
      const fields = memoFields(memo);

      return {
        key: 'memo:' + memo.id,
        date: memo.updatedAt.slice(0, 10),
        content: [fields.title, fields.body].filter(Boolean).join('\n'),
        time: null,
        kind: memo.deletedAt ? 'trash' : 'memo',
        memoId: memo.id,
      };
    });

  return [...daily, ...recurring, ...exceptions, ...memos].sort(compareResults);
}

function dailyResult(item: DailyPlanItem): SearchResult {
  return {
    key: `daily:${item.id}`,
    date: item.date,
    content: item.content,
    time: item.time ?? null,
    kind: 'daily',
  };
}

function recurringResult(plan: RecurringPlan): SearchResult {
  return {
    key: `recurring:${plan.id}`,
    date: plan.startDate,
    content: plan.title,
    time: plan.time,
    kind: 'recurring',
    recurringId: plan.id,
    endDate: plan.endDate,
  };
}

function exceptionResult(
  exception: RecurringPlanException,
  plans: Map<string, RecurringPlan>,
  holidays: HolidayService,
): SearchResult[] {
  const plan = plans.get(exception.recurringPlanId);
  const hasTitleOverride = plan !== undefined && exception.title !== undefined;

  if (!hasTitleOverride) {
    return [];
  }
  const entry = recurringEntry(plan, exception.date, holidays, exception);
  const visible = entry !== null;

  if (!visible) {
    return [];
  }

  return [
    {
      key: `exception:${plan.id}:${exception.date}`,
      date: exception.date,
      content: exception.title ?? plan.title,
      time: entry.time,
      kind: 'exception',
    },
  ];
}

function compareResults(first: SearchResult, second: SearchResult) {
  return (
    second.date.localeCompare(first.date) ||
    (first.time ?? '').localeCompare(second.time ?? '') ||
    first.key.localeCompare(second.key)
  );
}

export function groupSearchResults(results: SearchResult[]) {
  const groups = new Map<string, SearchResult[]>();

  results.forEach((result) => {
    const isMemo = result.kind === 'memo' || result.kind === 'trash';
    const month = isMemo ? '메모' : result.date.slice(0, 7);
    const items = groups.get(month) ?? [];

    items.push(result);
    groups.set(month, items);
  });

  return [...groups].map(([month, data]) => ({ month, data }));
}
