import { randomUUID } from 'expo-crypto';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Button, Label, showDialog, useTheme } from '../../../components/ui';
import { usePlanner } from '../../../stores/planner';
import { today } from '../../../utils/date';
import { useInlineKeyboard } from '../../planner/hooks/useInlineKeyboard';
import { usePlannerActions } from '../../planner/hooks/usePlannerActions';
import type { RecurringPlan } from '../../planner/types';
import { RecurringForm } from '../components/RecurringForm';
import { getRecurringSummary } from '../services/presentation';
import * as styles from './RecurringScreen.styles';

function RecurringRow({
  plan,
  onEdit,
}: {
  plan: RecurringPlan;
  onEdit(plan: RecurringPlan): void;
}) {
  const theme = useTheme();
  const { deleteRecurring } = usePlannerActions();
  const title = (plan.time ? plan.time + ' ' : '') + plan.title;
  const endDate = plan.endDate ? plan.endDate + '까지' : '계속';

  function handleDelete() {
    showDialog('반복 일정 삭제', '이 반복 일정과 연결된 날짜별 예외를 모두 삭제합니다.', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteRecurring(plan.id) },
    ]);
  }

  return (
    <View style={styles.recurringRowViewStyle(theme)}>
      <Button title={title} onPress={() => onEdit(plan)} style={styles.recurringRowButtonStyle} />
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
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const { handleInputFocus, scheduleReveal, handleKeyboardScroll } = useInlineKeyboard(scrollRef);
  const plans = usePlanner((state) => state.data.recurringPlans);
  const [draft, setDraft] = useState<RecurringPlan | null>(
    () => usePlanner.getState().data.recurringPlans.find((plan) => plan.id === initialId) ?? null,
  );
  const isEmpty = plans.length === 0;
  const sortedPlans = [...plans].sort((first, second) => first.id.localeCompare(second.id));

  function handleEdit(plan: RecurringPlan) {
    setDraft(plan);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function handleAdd() {
    handleEdit({
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.recurringContentKeyboardAvoidingViewStyle(theme)}
    >
      <ScrollView
        ref={scrollRef}
        onContentSizeChange={scheduleReveal}
        onScroll={handleKeyboardScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.recurringContentScrollViewContentContainerStyle}
      >
        {draft ? (
          <RecurringForm
            key={draft.id}
            initial={draft}
            onInputFocus={handleInputFocus}
            onInputLayout={scheduleReveal}
            onClose={() => {
              Keyboard.dismiss();
              setDraft(null);
            }}
          />
        ) : (
          <>
            <Label muted style={styles.recurringContentLabelStyle}>
              자주 하는 일은 한 번만 적어 두세요.
            </Label>
            {isEmpty ? (
              <Label muted style={styles.recurringContentLabelStyle2}>
                아직 반복 일정이 없습니다.
              </Label>
            ) : null}

            {sortedPlans.map((plan) => (
              <RecurringRow key={plan.id} plan={plan} onEdit={handleEdit} />
            ))}
            <Button title="+ 반복 일정 추가" selected onPress={handleAdd} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function RecurringScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  return <RecurringContent key={id ?? 'list'} initialId={id} />;
}
