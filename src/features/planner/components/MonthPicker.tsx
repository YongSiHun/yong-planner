import { useState } from 'react';
import { View } from 'react-native';
import { Button, Input, Label, useTheme } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
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
  const [selectedMonth, setSelectedMonth] = useState(Number(month.slice(5, 7)));
  const yearNumber = Number(year);
  const validYear = Number.isInteger(yearNumber) && yearNumber >= 1 && yearNumber <= 9999;

  return (
    <Dialog
      title="연월 이동"
      onClose={onClose}
      footer={
        <Button
          title="이동하기"
          disabled={!validYear}
          onPress={() =>
            onChoose(
              String(yearNumber).padStart(4, '0') +
                '-' +
                String(selectedMonth).padStart(2, '0') +
                '-01',
            )
          }
          textColor={theme.onAccent}
          style={styles.monthPickerButtonStyle(theme)}
        />
      }
    >
      <View style={styles.monthPickerViewStyle}>
        <Button
          compact
          title="−"
          accessibilityLabel="이전 연도"
          disabled={!validYear || yearNumber <= 1}
          onPress={() => setYear(String(yearNumber - 1))}
        />
        <View style={styles.monthPickerViewStyle2}>
          <Input
            value={year}
            onChangeText={(value) => setYear(value.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
            accessibilityLabel="이동할 연도"
            style={styles.monthPickerInputStyle}
          />
        </View>
        <Label>년</Label>
        <Button
          compact
          title="+"
          accessibilityLabel="다음 연도"
          disabled={!validYear || yearNumber >= 9999}
          onPress={() => setYear(String(yearNumber + 1))}
        />
      </View>
      <View style={styles.monthPickerViewStyle3}>
        {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
          <Button
            key={value}
            compact
            title={value + '월'}
            selected={selectedMonth === value}
            onPress={() => setSelectedMonth(value)}
            style={styles.monthPickerButtonStyle2}
          />
        ))}
      </View>
    </Dialog>
  );
}
