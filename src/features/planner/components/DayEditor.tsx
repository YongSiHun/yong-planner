import { useMemo, useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Input, Label, Sheet, report, styles, useTheme } from '../../../components/ui';
import {
  usePlanner,
  addDaily,
  editDaily,
  deleteDaily,
  saveOrder,
  saveException,
} from '../../../stores/planner';
import { plansForDate } from '../services/plans';
import { createHolidayService } from '../../../services/holiday';
import { dayLabel, shiftDate, validTime } from '../../../utils/date';
import { Calendar } from './Calendar';
import { DragList } from './DragList';
import type { PlanEntry } from '../types';

type RecurringEdit = { entry: PlanEntry; title: string; time: string };
export function DayEditor({
  date,
  onDate,
  onClose,
}: {
  date: string;
  onDate(date: string): void;
  onClose(): void;
}) {
  const data = usePlanner((state) => state.data);
  const error = usePlanner((state) => state.error);
  const saving = usePlanner((state) => state.saving);
  const dirty = usePlanner((state) => state.dirty);
  const theme = useTheme();
  const holidays = useMemo(
    () => createHolidayService(data.holidayOverrides),
    [data.holidayOverrides],
  );
  const entries = plansForDate(data, date, holidays);
  const [calendar, setCalendar] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [actions, setActions] = useState<RecurringEdit | null>(null);
  const [exception, setException] = useState<RecurringEdit | null>(null);
  const navigationBusy = useRef(false);

  const flushThen = async (action: () => void) => {
    if (navigationBusy.current) return;
    navigationBusy.current = true;
    try {
      await usePlanner.getState().flush();
      action();
    } catch (error) {
      report(error);
    } finally {
      navigationBusy.current = false;
    }
  };
  const close = () => {
    void flushThen(() => {
      Keyboard.dismiss();
      onClose();
    });
  };
  const changeDate = (next: string) => {
    const keepKeyboard = Keyboard.isVisible();
    void flushThen(() => {
      const first = usePlanner.getState().data.dailyPlanItems.find((item) => item.date === next);
      setFocusId(keepKeyboard ? (first?.id ?? null) : null);
      setCalendar(false);
      onDate(next);
    });
  };
  const openRecurring = (entry: PlanEntry) => {
    const plan = data.recurringPlans.find((item) => item.id === entry.sourceId)!;
    const old = data.recurringPlanExceptions.find(
      (item) => item.recurringPlanId === plan.id && item.date === date,
    );
    setActions({
      entry,
      title: old?.title ?? plan.title,
      time: (old?.time !== undefined ? old.time : plan.time) ?? '',
    });
  };
  const saveDateException = () => {
    if (!exception) return;
    try {
      if (!exception.title.trim() || !validTime(exception.time || null)) {
        throw new Error('제목과 시간(HH:mm)을 확인해 주세요.');
      }
      saveException(exception.entry.sourceId, date, {
        recurringPlanId: exception.entry.sourceId,
        date,
        cancelled: false,
        title: exception.title,
        time: exception.time || null,
      });
      setException(null);
    } catch (error) {
      report(error);
    }
  };

  return (
    <Sheet title="하루 계획" onClose={close}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Button title="‹ 전날" onPress={() => changeDate(shiftDate(date, -1))} />
        <Button
          title={dayLabel(date) + ' ▾'}
          onPress={() => {
            void flushThen(() => {
              Keyboard.dismiss();
              setCalendar(true);
            });
          }}
        />
        <Button title="다음 날 ›" onPress={() => changeDate(shiftDate(date, 1))} />
      </View>
      <View style={[styles.row, { justifyContent: 'space-between', paddingVertical: 8 }]}>
        <Label muted>{saving ? '저장 중…' : dirty ? '입력 저장 대기' : '저장됨'}</Label>
        <Button title="기본 순서로" onPress={() => saveOrder(date, null)} />
      </View>
      {error ? (
        <View>
          <Label style={{ color: theme.red }}>{error}</Label>
          <Button
            title="다시 저장"
            onPress={() => {
              void flushThen(() => {});
            }}
          />
        </View>
      ) : null}
      <DragList
        key={date}
        items={entries}
        id={(entry) => entry.id}
        onOrder={(items) =>
          saveOrder(
            date,
            items.map((entry) => entry.id),
          )
        }
        render={(entry) =>
          entry.kind === 'daily' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Input
                accessibilityLabel="일반 일정 내용"
                multiline
                autoFocus={focusId === entry.sourceId}
                value={entry.content}
                onChangeText={(content) => editDaily(entry.sourceId, content)}
                placeholder="하고 싶은 일을 적어 보세요"
                style={{ flex: 1, borderWidth: 0, paddingHorizontal: 4 }}
              />
              <Button title="삭제" danger onPress={() => deleteDaily(entry.sourceId)} />
            </View>
          ) : (
            <Button
              title={'↻ ' + entry.content}
              onPress={() => openRecurring(entry)}
              style={{ alignItems: 'flex-start' }}
            />
          )
        }
        footer={
          <View>
            <Button title="+ 일정 추가" onPress={() => setFocusId(addDaily(date))} />
            {data.recurringPlanExceptions
              .filter((item) => item.date === date)
              .map((item) => (
                <View key={item.recurringPlanId} style={styles.row}>
                  <Label muted style={{ flex: 1 }}>
                    {data.recurringPlans.find((plan) => plan.id === item.recurringPlanId)?.title}
                    {' · '}
                    {item.cancelled ? '이 날짜 취소' : '이 날짜 수정'}
                  </Label>
                  <Button
                    title="예외 초기화"
                    onPress={() => saveException(item.recurringPlanId, date, null)}
                  />
                </View>
              ))}
          </View>
        }
      />
      <Button title="완료" selected onPress={close} style={{ marginVertical: 8 }} />
      {actions ? (
        <Sheet title="반복 일정" onClose={() => setActions(null)} scroll>
          <Label>{actions.entry.content}</Label>
          <Button
            title="이 날짜만 취소"
            onPress={() => {
              const old = data.recurringPlanExceptions.find(
                (item) => item.recurringPlanId === actions.entry.sourceId && item.date === date,
              );
              saveException(actions.entry.sourceId, date, {
                ...old,
                recurringPlanId: actions.entry.sourceId,
                date,
                cancelled: true,
              });
              setActions(null);
            }}
          />
          <Button
            title="이 날짜만 수정"
            onPress={() => {
              setException(actions);
              setActions(null);
            }}
          />
          <Button
            title="이 날짜 예외 초기화"
            onPress={() => {
              saveException(actions.entry.sourceId, date, null);
              setActions(null);
            }}
          />
          <Button
            title="반복 일정 전체 수정"
            onPress={() => {
              void flushThen(() => {
                setActions(null);
                onClose();
                router.push({ pathname: '/recurring', params: { id: actions.entry.sourceId } });
              });
            }}
          />
        </Sheet>
      ) : null}
      {calendar ? (
        <Sheet title="날짜 선택" onClose={() => setCalendar(false)}>
          <Calendar selected={date} onSelect={changeDate} />
        </Sheet>
      ) : null}
      {exception ? (
        <Sheet title="이 날짜만 수정" onClose={() => setException(null)} scroll>
          <Label>{dayLabel(date)}</Label>
          <Input
            accessibilityLabel="이 날짜 제목"
            value={exception.title}
            onChangeText={(title) => setException({ ...exception, title })}
            multiline
          />
          <Input
            accessibilityLabel="이 날짜 시간, 비우면 시간 없음"
            placeholder="HH:mm · 비우면 시간 없음"
            value={exception.time}
            onChangeText={(time) => setException({ ...exception, time })}
          />
          <Button title="저장" selected onPress={saveDateException} />
        </Sheet>
      ) : null}
    </Sheet>
  );
}
