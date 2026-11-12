import { View } from 'react-native';
import { Input, Label } from '../../../components/ui';
import * as styles from './HolidayDateInput.styles';

const dateFields = [
  { label: '연도', placeholder: 'YYYY', length: 4 },
  { label: '월', placeholder: 'MM', length: 2 },
  { label: '일', placeholder: 'DD', length: 2 },
];

export function HolidayDateInput({
  date,
  onChange,
}: {
  date: string;
  onChange(date: string): void;
}) {
  const parts = date.split('-');

  function changePart(index: number, value: string) {
    const numeric = /^\d*$/.test(value) && value.length <= dateFields[index]!.length;

    if (!numeric) {
      return;
    }
    const next = [...parts];

    next[index] = value;
    onChange(next.join('-'));
  }

  function padPart(index: number) {
    const value = parts[index]!;
    const hasValue = value.length > 0;

    if (hasValue) {
      changePart(index, value.padStart(dateFields[index]!.length, '0'));
    }
  }

  return (
    <View style={styles.dateRow}>
      {dateFields.map((field, index) => (
        <View key={field.label} style={index === 0 ? styles.yearField : styles.dateField}>
          <Label muted>{field.label}</Label>
          <Input
            accessibilityLabel={'보정 날짜 ' + field.label}
            value={parts[index]}
            onChangeText={(value) => changePart(index, value)}
            onBlur={() => padPart(index)}
            keyboardType="number-pad"
            maxLength={field.length}
            placeholder={field.placeholder}
          />
        </View>
      ))}
    </View>
  );
}
