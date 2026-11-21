import { Pressable, View } from 'react-native';
import { useScheduleInputState } from '../hooks/useScheduleInputState';
import { useScheduleChipLayout } from '../hooks/useScheduleChipLayout';
import type { ScheduleInputProps } from '../types/presentation';
import { ScheduleInputChip } from './ScheduleInputChip';
import { ScheduleTextField } from './ScheduleTextField';
import * as styles from './ScheduleInput.styles';

export function ScheduleInput(props: ScheduleInputProps) {
  const editor = useScheduleInputState(props);
  const layout = useScheduleChipLayout(editor.entries, editor.activate);

  return (
    <Pressable accessible={false} onPress={layout.handleBlankPress} style={styles.field}>
      {editor.entries.flatMap((entry, index) => {
        const active = index === editor.active;

        if (!active) {
          return [
            <ScheduleInputChip
              key={entry.key}
              entry={entry}
              timeFormat={props.timeFormat}
              onActivate={editor.activateEntry}
              onRecord={layout.record}
            />,
          ];
        }
        const hasFollowing = index < editor.entries.length - 1;

        return [
          <ScheduleTextField
            key={'editor-' + editor.session}
            date={props.date}
            inputRef={editor.input}
            initialValue={editor.initialValue}
            nativeValue={editor.nativeValue}
            onChange={editor.handleChange}
            onFocus={editor.handleFocus}
            onBlur={editor.handleBlur}
            onLayout={(event) => {
              layout.record(entry.key, event);
              props.onInputLayout();
            }}
          />,
          ...(hasFollowing
            ? [
                <View
                  key="editor-break"
                  pointerEvents="none"
                  accessible={false}
                  style={styles.editorBreak}
                />,
              ]
            : []),
        ];
      })}
    </Pressable>
  );
}
