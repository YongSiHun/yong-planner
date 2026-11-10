import { useState } from 'react';
import { View } from 'react-native';
import { Button, design, Input, Label, useTheme } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import { monthSelection } from '../services/monthSelection';
import * as styles from './MonthPicker.styles';

export function MonthPicker({
  month,
  onClose,
  onChoose,
}: {
  month: string;
  onClose(): void;
  onChoose(date: string): void;
}) {
  const theme = useTheme();
  const [year, setYear] = useState(month.slice(0, 4));
  const [selectedMonth, setSelectedMonth] = useState(String(Number(month.slice(5, 7))));
  const validation = monthSelection(year, selectedMonth);

  function choose() {
    const date = monthSelection(year, selectedMonth).date;

    if (!date) {
      return;
    }
    onChoose(date);
  }

  return (
    <Dialog
      title="날짜 이동"
      onClose={onClose}
      footer={
        <Button
          title="이동하기"
          labelSize={design.type.action}
          bold
          disabled={validation.date === null}
          onPress={choose}
          style={styles.moveAction(theme)}
        />
      }
    >
      <NumberField
        label="연도"
        unit="년"
        value={year}
        maximum={9999}
        error={validation.yearError}
        onChange={setYear}
      />
      <NumberField
        label="월"
        wrap
        unit="월"
        value={selectedMonth}
        maximum={12}
        error={validation.monthError}
        onChange={setSelectedMonth}
      />
    </Dialog>
  );
}

function NumberField({
  label,
  unit,
  value,
  maximum,
  wrap = false,
  error,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  maximum: number;
  wrap?: boolean;
  error: string | null;
  onChange(value: string): void;
}) {
  const theme = useTheme();
  const number = Number(value);

  function step(amount: number) {
    const next = wrap ? ((number - 1 + amount + maximum) % maximum) + 1 : number + amount;
    const valid = error === null && next >= 1 && next <= maximum;

    if (!valid) {
      return;
    }
    onChange(String(next));
  }

  return (
    <View>
      <View style={styles.monthPickerViewStyle}>
        <Button
          compact
          bold
          title="−"
          accessibilityLabel={'이전 ' + label}
          disabled={stepDisabled(error, wrap, number <= 1)}
          onPress={() => step(-1)}
        />
        <View style={styles.monthPickerViewStyle2}>
          <Input
            value={value}
            onChangeText={onChange}
            keyboardType="number-pad"
            accessibilityLabel={'이동할 ' + label}
            style={styles.monthPickerInputStyle}
          />
        </View>
        <Label style={styles.unit}>{unit}</Label>
        <Button
          compact
          bold
          title="+"
          accessibilityLabel={'다음 ' + label}
          disabled={stepDisabled(error, wrap, number >= maximum)}
          onPress={() => step(1)}
        />
      </View>
      {error ? <Label style={styles.validation(theme)}>{error}</Label> : null}
    </View>
  );
}

function stepDisabled(error: string | null, wrap: boolean, atLimit: boolean): boolean {
  return error !== null || (!wrap && atLimit);
}
