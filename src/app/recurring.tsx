import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { Button, Label, styles, useTheme } from '../components/ui';
import { usePlanner, deleteRecurring } from '../stores/planner';
import type { RecurringPlan } from '../features/planner/types';
import { today } from '../utils/date';
import { RecurringForm } from '../features/recurring/components/RecurringForm';
import { getRecurringSummary } from '../features/recurring/services/presentation';

function RecurringRow({
  plan,
  onEdit,
}: {
  plan: RecurringPlan;
  onEdit(plan: RecurringPlan): void;
}) {
  const theme = useTheme();
  const title = (plan.time ? plan.time + ' ' : '') + plan.title;
  const endDate = plan.endDate ? plan.endDate + '까지' : '계속';

  function handleDelete() {
    Alert.alert('반복 일정 삭제', '이 반복 일정과 연결된 날짜별 예외를 모두 삭제합니다.', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteRecurring(plan.id) },
    ]);
  }

  return (
    <View style={{ paddingVertical: 16, borderBottomWidth: 1, borderColor: theme.line }}>
      <Button title={title} onPress={() => onEdit(plan)} style={{ alignItems: 'flex-start' }} />
      <Label muted>{getRecurringSummary(plan)}</Label>
      <Label muted>
        {plan.startDate}부터 {endDate}
      </Label>
      <Button title="전체 삭제" danger onPress={handleDelete} />
    </View>
  );
}

function RecurringContent({ initialId }: { initialId?: string }) {
  const theme = useTheme();
  const plans = usePlanner((state) => state.data.recurringPlans);
  const [draft, setDraft] = useState<RecurringPlan | null>(
    () => usePlanner.getState().data.recurringPlans.find((plan) => plan.id === initialId) ?? null,
  );
  const isEmpty = plans.length === 0;
  const sortedPlans = [...plans].sort((first, second) => first.id.localeCompare(second.id));

  function handleAdd() {
    setDraft({
      id: randomUUID(),
      title: '',
      time: null,
      startDate: today(),
      endDate: null,
      weekdays: [1, 2, 3, 4, 5],
      holidayPolicy: 'include',
    });
  }

  return (
    <View style={[styles.page, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Label muted style={{ marginVertical: 16 }}>
          자주 하는 일은 한 번만 적어 두세요.
        </Label>
        {isEmpty ? (
          <Label muted style={{ marginVertical: 32 }}>
            아직 반복 일정이 없습니다.
          </Label>
        ) : null}

        {sortedPlans.map((plan) => (
          <RecurringRow key={plan.id} plan={plan} onEdit={setDraft} />
        ))}
        <Button title="+ 반복 일정 추가" selected onPress={handleAdd} />
      </ScrollView>

      {draft ? (
        <RecurringForm key={draft.id} initial={draft} onClose={() => setDraft(null)} />
      ) : null}
    </View>
  );
}

export default function RecurringScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  return <RecurringContent key={id ?? 'list'} initialId={id} />;
}
