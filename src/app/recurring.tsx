import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { Button, Input, Label, Sheet, report, styles, useTheme } from '../components/ui';
import { usePlanner, saveRecurring, deleteRecurring } from '../stores/planner';
import type { RecurringPlan } from '../features/planner/types';
import { today, weekdays, validTime, parseDate } from '../utils/date';
import { Calendar } from '../features/planner/components/Calendar';
function Form({ initial, onClose }: { initial: RecurringPlan; onClose(): void }) {
  const [draft, setDraft] = useState(initial);
  const [calendar, setCalendar] = useState<'startDate' | 'endDate' | null>(null);
  const [changed, setChanged] = useState(false);
  const set = (patch: Partial<RecurringPlan>) => {
    setChanged(true);
    setDraft((old) => ({ ...old, ...patch }));
  };
  const close = () => {
    if (!changed) {
      onClose();
      return;
    }
    Alert.alert('변경 내용 닫기', '아직 저장하지 않은 변경 내용을 버릴까요?', [
      { text: '계속 편집', style: 'cancel' },
      { text: '버리기', style: 'destructive', onPress: onClose },
    ]);
  };
  const save = async () => {
    try {
      parseDate(draft.startDate);
      if (draft.endDate) parseDate(draft.endDate);
      if (!validTime(draft.time)) throw new Error('시간은 HH:mm 형식으로 입력해 주세요.');
      saveRecurring(draft);
      await usePlanner.getState().flush();
      onClose();
    } catch (e) {
      report(e);
    }
  };
  return (
    <>
      <Sheet title={initial.title ? '반복 일정 수정' : '반복 일정 추가'} onClose={close} scroll>
        <Label>일정 이름</Label>
        <Input
          accessibilityLabel="반복 일정 이름"
          multiline
          value={draft.title}
          onChangeText={(title) => set({ title })}
          placeholder="예: 통근 버스"
        />
        <Label>시간 · 선택 사항</Label>
        <Input
          accessibilityLabel="반복 시간"
          value={draft.time ?? ''}
          onChangeText={(time) => set({ time: time || null })}
          placeholder="08:30 · 비우면 시간 없음"
          autoCapitalize="none"
        />
        <Label>공휴일</Label>
        <View style={styles.row}>
          {(
            [
              { value: 'include', label: '관계없음' },
              { value: 'exclude', label: '공휴일 제외' },
              { value: 'only', label: '공휴일만' },
            ] as const
          ).map((p) => (
            <Button
              key={p.value}
              title={p.label}
              selected={draft.holidayPolicy === p.value}
              onPress={() => set({ holidayPolicy: p.value })}
            />
          ))}
        </View>
        {draft.holidayPolicy !== 'only' ? (
          <>
            <Label>반복 요일</Label>
            <View style={styles.row}>
              <Button title="매일" onPress={() => set({ weekdays: [0, 1, 2, 3, 4, 5, 6] })} />
              <Button title="평일" onPress={() => set({ weekdays: [1, 2, 3, 4, 5] })} />
              <Button title="주말" onPress={() => set({ weekdays: [0, 6] })} />
            </View>
            <View style={styles.row}>
              {weekdays.map((label, day) => (
                <Button
                  key={day}
                  title={label}
                  selected={draft.weekdays.includes(day)}
                  onPress={() =>
                    set({
                      weekdays: draft.weekdays.includes(day)
                        ? draft.weekdays.filter((v) => v !== day)
                        : [...draft.weekdays, day].sort(),
                    })
                  }
                />
              ))}
            </View>
          </>
        ) : (
          <Label muted>요일과 관계없이 대한민국 공휴일에 반복합니다.</Label>
        )}
        <Label>시작일</Label>
        <Button title={draft.startDate + ' ▾'} onPress={() => setCalendar('startDate')} />
        <Label>종료일 · 해당 날짜 포함</Label>
        <View style={styles.row}>
          <Button
            title={draft.endDate ? draft.endDate + ' ▾' : '종료일 선택'}
            onPress={() => setCalendar('endDate')}
          />
          <Button
            title="종료일 없음"
            selected={!draft.endDate}
            onPress={() => set({ endDate: null })}
          />
        </View>
        <Button
          title="저장"
          selected
          onPress={() => {
            void save();
          }}
        />
        <Label muted>
          규칙을 변경해도 날짜별 예외는 유지됩니다. 변경된 규칙에 해당하는 날짜에서만 적용됩니다.
        </Label>
        {calendar ? (
          <Sheet
            title={calendar === 'startDate' ? '시작일 선택' : '종료일 선택'}
            onClose={() => setCalendar(null)}
          >
            <Calendar
              selected={draft[calendar] ?? draft.startDate}
              onSelect={(date) => {
                set({ [calendar]: date });
                setCalendar(null);
              }}
            />
          </Sheet>
        ) : null}
      </Sheet>
    </>
  );
}
export default function RecurringScreen() {
  const t = useTheme();
  const plans = usePlanner((s) => s.data.recurringPlans);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [draft, setDraft] = useState<RecurringPlan | null>(null);
  useEffect(() => {
    if (id) {
      const p = usePlanner.getState().data.recurringPlans.find((v) => v.id === id);
      if (p) setDraft(p);
    }
  }, [id]);
  return (
    <View style={[styles.page, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Label muted style={{ marginVertical: 16 }}>
          자주 하는 일은 한 번만 적어 두세요.
        </Label>
        {plans.length === 0 ? (
          <Label muted style={{ marginVertical: 32 }}>
            아직 반복 일정이 없습니다.
          </Label>
        ) : null}
        {[...plans]
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((plan) => (
            <View
              key={plan.id}
              style={{ paddingVertical: 16, borderBottomWidth: 1, borderColor: t.line }}
            >
              <Button
                title={(plan.time ? plan.time + ' ' : '') + plan.title}
                onPress={() => setDraft(plan)}
                style={{ alignItems: 'flex-start' }}
              />
              <Label muted>
                {plan.holidayPolicy === 'only'
                  ? '공휴일만'
                  : plan.weekdays.map((v) => weekdays[v]).join(' · ') +
                    (plan.holidayPolicy === 'exclude' ? ' / 공휴일 제외' : '')}
              </Label>
              <Label muted>
                {plan.startDate}부터 {plan.endDate ? plan.endDate + '까지' : '계속'}
              </Label>
              <Button
                title="전체 삭제"
                danger
                onPress={() =>
                  Alert.alert(
                    '반복 일정 삭제',
                    '이 반복 일정과 연결된 날짜별 예외를 모두 삭제합니다.',
                    [
                      { text: '취소', style: 'cancel' },
                      {
                        text: '삭제',
                        style: 'destructive',
                        onPress: () => deleteRecurring(plan.id),
                      },
                    ],
                  )
                }
              />
            </View>
          ))}
        <Button
          title="+ 반복 일정 추가"
          selected
          onPress={() =>
            setDraft({
              id: randomUUID(),
              title: '',
              time: null,
              startDate: today(),
              endDate: null,
              weekdays: [1, 2, 3, 4, 5],
              holidayPolicy: 'include',
            })
          }
        />
      </ScrollView>
      {draft ? <Form key={draft.id} initial={draft} onClose={() => setDraft(null)} /> : null}
    </View>
  );
}
