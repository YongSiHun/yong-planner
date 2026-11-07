import { displayPlanEntry } from '../services/time';
import { useRef, useState, type ComponentRef } from 'react';
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button, design, report, useTheme } from '../../../components/ui';
import { saveException, usePlanner } from '../../../stores/planner';
import { validTime } from '../../../utils/date';
import type { PlanEntry } from '../types';

export function RecurringNote({
  entry,
  date,
  onInputFocus,
  onInputLayout,
}: {
  entry: PlanEntry;
  date: string;
  onInputFocus(input: ComponentRef<typeof TextInput> | null): void;
  onInputLayout(): void;
}) {
  const theme = useTheme();
  const format = usePlanner((state) => state.data.settings.timeFormat ?? '24h');
  const displayContent = displayPlanEntry(entry, format);
  const titleInput = useRef<ComponentRef<typeof TextInput>>(null);
  const timeInput = useRef<ComponentRef<typeof TextInput>>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');

  function startEditing() {
    Keyboard.dismiss();
    const data = usePlanner.getState().data;
    const plan = data.recurringPlans.find((item) => item.id === entry.sourceId)!;
    const exception = data.recurringPlanExceptions.find(
      (item) => item.recurringPlanId === plan.id && item.date === date,
    );

    setTitle(exception?.title ?? plan.title);
    setTime((exception?.time === undefined ? plan.time : exception.time) ?? '');
    setEditing(true);
  }

  function save() {
    const isValid = title.trim().length > 0 && validTime(time || null);

    if (!isValid) {
      report(new Error('제목과 시간(HH:mm)을 확인해 주세요.'));

      return;
    }
    saveException(entry.sourceId, date, {
      recurringPlanId: entry.sourceId,
      date,
      cancelled: false,
      title,
      time: time || null,
    });
    Keyboard.dismiss();
    setEditing(false);
  }

  if (!editing) {
    return (
      <Pressable
        onPress={startEditing}
        accessibilityRole="button"
        accessibilityLabel={displayContent + ', 이 날짜 반복 일정 수정'}
        style={{ minHeight: 32, justifyContent: 'center' }}
      >
        <Text
          style={{
            color: theme.accent,
            fontFamily: design.font.regular,
            fontSize: design.type.body,
            lineHeight: design.lineHeight,
          }}
        >
          <Text style={{ color: theme.muted }}>↻ </Text>
          {displayContent}
        </Text>
      </Pressable>
    );
  }

  const inputStyle = {
    color: theme.text,
    fontFamily: design.font.regular,
    fontSize: design.type.body,
    padding: design.space.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
    minHeight: design.touchTarget,
  };

  return (
    <View style={{ paddingVertical: design.space.xs }}>
      <TextInput
        ref={titleInput}
        onFocus={() => onInputFocus(titleInput.current)}
        onBlur={() => onInputFocus(null)}
        onContentSizeChange={onInputLayout}
        onSelectionChange={onInputLayout}
        selectionColor={theme.accent}
        cursorColor={theme.accent}
        accessibilityLabel="이 날짜 반복 일정 제목"
        value={title}
        onChangeText={setTitle}
        style={inputStyle}
        multiline
      />
      <TextInput
        ref={timeInput}
        onFocus={() => onInputFocus(timeInput.current)}
        onBlur={() => onInputFocus(null)}
        onSelectionChange={onInputLayout}
        accessibilityLabel="이 날짜 시간"
        value={time}
        onChangeText={setTime}
        placeholder="HH:mm · 비우면 시간 없음"
        placeholderTextColor={theme.muted}
        selectionColor={theme.accent}
        cursorColor={theme.accent}
        style={inputStyle}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Button compact title="저장" onPress={save} />
        <Button
          compact
          title="닫기"
          onPress={() => {
            Keyboard.dismiss();
            setEditing(false);
          }}
        />
        <Button
          compact
          title="이 날짜 취소"
          danger
          onPress={() =>
            saveException(entry.sourceId, date, {
              recurringPlanId: entry.sourceId,
              date,
              cancelled: true,
            })
          }
        />
        <Button
          compact
          title="전체 수정"
          onPress={() => {
            Keyboard.dismiss();
            router.push({ pathname: '/recurring', params: { id: entry.sourceId } });
          }}
        />
      </View>
    </View>
  );
}
