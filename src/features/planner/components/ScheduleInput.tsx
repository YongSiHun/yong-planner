import { useRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTheme } from '../../../components/ui';
import { useScheduleInputState } from '../hooks/useScheduleInputState';
import { useInputHeight } from '../hooks/useInputHeight';
import type { ScheduleInputProps } from '../types/presentation';
import { ScheduleChip } from './ScheduleChip';
import { dropTarget, type ChipBounds } from '../services/dragGeometry';
import * as styles from './ScheduleInput.styles';

export function ScheduleInput(props: ScheduleInputProps) {
  const theme = useTheme();
  const boxes = useRef(new Map<number, ChipBounds>());
  const { height, handleContentSize } = useInputHeight();
  const {
    input,
    nativeValue,
    initialValue,
    handleChange,
    handleBlur,
    parts,
    active,
    activate,
    marks,
  } = useScheduleInputState(props);

  return (
    <Pressable
      accessible={false}
      onPress={(event) => {
        const target =
          event &&
          dropTarget(
            new Map([...boxes.current].filter(([index]) => index < parts.length)),
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
          );

        activate(target?.boundary ?? parts.length, true);
      }}
      style={styles.field}
    >
      {parts.map((part, index) =>
        index === active ? (
          <TextInput
            key="editor"
            ref={input}
            multiline
            submitBehavior="newline"
            autoFocus
            autoCorrect={false}
            spellCheck={false}
            autoCapitalize="none"
            smartInsertDelete={false}
            defaultValue={initialValue}
            value={nativeValue}
            onChange={handleChange}
            onFocus={() => props.onInputFocus(input.current)}
            onBlur={handleBlur}
            onLayout={(event) => {
              boxes.current.set(index, event.nativeEvent.layout);
              props.onInputLayout();
            }}
            accessibilityLabel={props.date + ' 일정 입력'}
            accessibilityHint="쉼표를 입력하거나 다른 곳을 누르면 칩으로 완성해요."
            placeholder="일정 입력"
            placeholderTextColor={theme.muted}
            selectionColor={theme.accent}
            cursorColor={theme.accent}
            underlineColorAndroid="transparent"
            textAlignVertical="top"
            scrollEnabled={false}
            onContentSizeChange={handleContentSize}
            style={styles.input(theme, height)}
          />
        ) : (
          <View
            key={'chip-' + index}
            onLayout={(event) => boxes.current.set(index, event.nativeEvent.layout)}
            style={styles.chipWrapper}
          >
            <ScheduleChip
              key={'chip-' + index}
              content={part}
              important={marks[index]?.important}
              alarm={marks[index]?.alarm}
              timeFormat={props.timeFormat}
              onPress={() => activate(index)}
              onLongPress={() => activate(index)}
              onBefore={() => activate(index, true)}
              onAfter={() => activate(index + 1, true)}
            />
          </View>
        ),
      )}
    </Pressable>
  );
}
