export interface DailyPlanItem {
  id: string;
  date: string;
  content: string;
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
export interface Settings {
  theme: 'system' | 'light' | 'dark';
}
export interface PlannerData {
  dailyPlanItems: DailyPlanItem[];
  recurringPlans: RecurringPlan[];
  recurringPlanExceptions: RecurringPlanException[];
  dailyPlanOrders: DailyPlanOrder[];
  settings: Settings;
  holidayOverrides: HolidayOverride[];
}
export interface PlanEntry {
  id: string;
  sourceId: string;
  kind: 'daily' | 'recurring';
  content: string;
  time: string | null;
  sortKey: string;
}
export const emptyData = (): PlannerData => ({
  dailyPlanItems: [],
  recurringPlans: [],
  recurringPlanExceptions: [],
  dailyPlanOrders: [],
  settings: { theme: 'system' },
  holidayOverrides: [],
});
