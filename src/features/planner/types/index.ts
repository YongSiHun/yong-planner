export interface DailyPlanItem {
  id: string;
  date: string;
  content: string;
  important?: boolean;
  alarm?: boolean;
  time?: string | null;
  createdAt: string;
}
export type HolidayPolicy = 'include' | 'exclude' | 'only';
export interface RecurringPlan {
  id: string;
  title: string;
  time: string | null;
  startDate: string;
  endDate: string | null;
  weekdays: number[];
  holidayPolicy: HolidayPolicy;
}
export interface RecurringPlanException {
  recurringPlanId: string;
  date: string;
  cancelled: boolean;
  title?: string;
  time?: string | null;
}
export interface DailyPlanOrder {
  date: string;
  itemIds: string[];
}
export interface HolidayOverride {
  date: string;
  name: string | null;
}
export type TimeFormat = '12h' | '24h';
export interface Settings {
  theme: 'system' | 'light' | 'dark';
  timeFormat?: TimeFormat;
}
export interface Memo {
  id: string;
  title?: string;
  content: string;
  updatedAt: string;
}
export interface PlannerData {
  memos?: Memo[];
  dailyPlanItems: DailyPlanItem[];
  recurringPlans: RecurringPlan[];
  recurringPlanExceptions: RecurringPlanException[];
  dailyPlanOrders: DailyPlanOrder[];
  settings: Settings;
  holidayOverrides: HolidayOverride[];
}
export interface PlanEntry {
  alarm?: boolean;
  important?: boolean;
  id: string;
  sourceId: string;
  kind: 'daily' | 'recurring';
  content: string;
  time: string | null;
  sortKey: string;
}
export const emptyData = (): PlannerData => ({
  memos: [],
  dailyPlanItems: [],
  recurringPlans: [],
  recurringPlanExceptions: [],
  dailyPlanOrders: [],
  settings: { theme: 'system' },
  holidayOverrides: [],
});
