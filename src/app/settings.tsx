import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import Constants from 'expo-constants';
import { Button, Input, Label, Sheet, report, styles, useTheme } from '../components/ui';
import { usePlanner } from '../stores/planner';
import { backupFile, chooseBackup } from '../services/export/files';
import { today, parseDate } from '../utils/date';
export default function SettingsScreen() {
  const t = useTheme();
  const data = usePlanner((s) => s.data);
  const restoring = usePlanner((s) => s.restoring);
  const [busy, setBusy] = useState(false);
  const [holiday, setHoliday] = useState(false);
  const [date, setDate] = useState(today());
  const [name, setName] = useState('');
  const task = async (work: () => Promise<void>) => {
    setBusy(true);
    try {
      await work();
    } catch (e) {
      report(e);
    } finally {
      setBusy(false);
    }
  };
  const restore = async () => {
    const next = await chooseBackup();
    if (!next) return;
    Alert.alert(
      '전체 데이터 복원',
      '현재 일정을 백업 파일의 데이터로 교체합니다. 먼저 JSON 백업을 보관하는 것을 권장합니다. 복원할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전체 교체',
          style: 'destructive',
          onPress: () => {
            void task(async () => {
              await usePlanner.getState().restore(next);
              Alert.alert('복원 완료', '백업의 일정을 모두 불러왔습니다.');
            });
          },
        },
      ],
    );
  };
  return (
    <ScrollView
      style={[styles.page, { backgroundColor: t.bg }]}
      contentContainerStyle={{ paddingBottom: 40, gap: 16 }}
    >
      <Label style={{ marginTop: 20, fontWeight: '700' }}>화면 테마</Label>
      <View style={styles.row}>
        {(
          [
            { value: 'system', label: '시스템' },
            { value: 'light', label: '라이트' },
            { value: 'dark', label: '다크' },
          ] as const
        ).map((option) => (
          <Button
            key={option.value}
            title={option.label}
            selected={data.settings.theme === option.value}
            onPress={() =>
              usePlanner
                .getState()
                .update((d) => ({ ...d, settings: { theme: option.value } }), true)
            }
          />
        ))}
      </View>
      <View style={{ height: 1, backgroundColor: t.line }} />
      <Label style={{ fontWeight: '700' }}>데이터 보관</Label>
      <Label muted>
        일정은 이 기기에 저장됩니다. 기기를 바꾸기 전에는 JSON 백업 파일을 보관해 주세요.
      </Label>
      <Button
        title={busy ? '처리 중…' : 'JSON 백업 파일 공유'}
        disabled={busy || restoring}
        selected
        onPress={() => {
          void task(backupFile);
        }}
      />
      <Button
        title="JSON 백업에서 복원"
        disabled={busy || restoring}
        onPress={() => {
          void task(restore);
        }}
      />
      <View style={{ height: 1, backgroundColor: t.line }} />
      <Label style={{ fontWeight: '700' }}>공휴일 보정</Label>
      <Label muted>
        라이브러리에 없는 임시공휴일을 추가하거나 특정 날짜의 공휴일을 해제할 수 있습니다.
      </Label>
      {data.holidayOverrides.map((o) => (
        <View key={o.date} style={styles.row}>
          <Label style={{ flex: 1 }}>
            {o.date} · {o.name ?? '공휴일 해제'}
          </Label>
          <Button
            title="삭제"
            onPress={() =>
              usePlanner.getState().update(
                (d) => ({
                  ...d,
                  holidayOverrides: d.holidayOverrides.filter((v) => v.date !== o.date),
                }),
                true,
              )
            }
          />
        </View>
      ))}
      <Button title="+ 공휴일 보정 추가" onPress={() => setHoliday(true)} />
      <Label muted>용플래너 {Constants.expoConfig?.version ?? '1.0.0'}</Label>
      <Label muted style={{ fontSize: 12 }}>
        공휴일: date-holidays / commenthol · ISC 및 CC BY 3.0{'\n'}
        github.com/commenthol/date-holidays
      </Label>
      {holiday ? (
        <Sheet title="공휴일 보정" onClose={() => setHoliday(false)} scroll>
          <Input
            accessibilityLabel="보정 날짜"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
          <Input
            accessibilityLabel="공휴일 이름"
            value={name}
            onChangeText={setName}
            placeholder="임시공휴일 이름 · 비우면 공휴일 해제"
          />
          <Button
            title="저장"
            selected
            onPress={() => {
              try {
                parseDate(date);
                if (name && !name.trim()) throw new Error('공휴일 이름을 확인해 주세요.');
                usePlanner.getState().update(
                  (d) => ({
                    ...d,
                    holidayOverrides: [
                      ...d.holidayOverrides.filter((o) => o.date !== date),
                      { date, name: name || null },
                    ],
                  }),
                  true,
                );
                setHoliday(false);
                setName('');
              } catch (e) {
                report(e);
              }
            }}
          />
        </Sheet>
      ) : null}
    </ScrollView>
  );
}
