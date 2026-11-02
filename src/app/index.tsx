import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Label, Sheet, report, styles, useTheme } from '../components/ui';
import { usePlanner } from '../stores/planner';
import { monthDates, monthLabel, shiftMonth, today, weekday, weekdays } from '../utils/date';
import { plansForDate } from '../features/planner/services/plans';
import { createHolidayService } from '../services/holiday';
import { DayEditor } from '../features/planner/components/DayEditor';
import { exportMonth } from '../services/export/files';
export default function PlannerScreen() {
  const t = useTheme();
  const { fontScale } = useWindowDimensions();
  const data = usePlanner((s) => s.data);
  const error = usePlanner((s) => s.error);
  const [localToday, setLocalToday] = useState(today());
  const [month, setMonth] = useState(today());
  const [editing, setEditing] = useState<string | null>(null);
  const [menu, setMenu] = useState<'menu' | 'export' | null>(null);
  const scroll = useRef<ScrollView>(null);
  const positions = useRef(new Map<string, number>());
  const pending = useRef<string | null>(today());
  const holidays = useMemo(
    () => createHolidayService(data.holidayOverrides),
    [data.holidayOverrides],
  );
  const dates = monthDates(month);
  useEffect(() => {
    const refresh = () => setLocalToday(today());
    const timer = setInterval(refresh, 60000);
    const app = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      app.remove();
    };
  }, []);
  const scrollTo = (date: string, animated = true) => {
    const y = positions.current.get(date);
    if (y !== undefined) {
      scroll.current?.scrollTo({ y: Math.max(0, y - 12), animated });
      pending.current = null;
    }
  };
  const showDate = (date: string) => {
    pending.current = date;
    if (month.slice(0, 7) !== date.slice(0, 7)) {
      positions.current.clear();
      setMonth(date);
    } else scrollTo(date);
  };
  const changeMonth = (amount: number) => {
    positions.current.clear();
    pending.current = null;
    setMonth(shiftMonth(month.slice(0, 7) + '-01', amount));
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const doExport = async (format: 'txt' | 'csv' | 'clipboard') => {
    try {
      await exportMonth(month, format);
      setMenu(null);
      if (format === 'clipboard')
        Alert.alert('복사 완료', '이번 달 계획을 클립보드에 복사했습니다.');
    } catch (e) {
      report(e);
    }
  };
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.bg }}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Label muted style={{ letterSpacing: 3, fontSize: 12 }}>
            YONG PLANNER
          </Label>
          <Button title="메뉴" onPress={() => setMenu('menu')} />
        </View>
        <View style={[styles.row, { justifyContent: 'center', marginVertical: 8 }]}>
          <Button title="‹ 이전 달" onPress={() => changeMonth(-1)} />
          <Text
            accessibilityRole="header"
            style={{ color: t.text, fontSize: 26, fontWeight: '700', paddingHorizontal: 8 }}
          >
            {monthLabel(month)}
          </Text>
          <Button title="다음 달 ›" onPress={() => changeMonth(1)} />
        </View>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Button title="오늘" onPress={() => showDate(today())} />
          <Button title="내보내기 ↗" onPress={() => setMenu('export')} />
        </View>
        {error ? (
          <Button
            title="저장 실패 · 다시 저장"
            danger
            onPress={() => {
              void usePlanner.getState().flush().catch(report);
            }}
          />
        ) : null}
        <View style={{ height: 1, backgroundColor: t.line, marginTop: 6 }} />
      </View>
      <ScrollView
        key={month.slice(0, 7)}
        ref={scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 300 }}
        onContentSizeChange={() => {
          if (pending.current) scrollTo(pending.current, false);
        }}
      >
        {dates.map((date) => {
          const entries = plansForDate(data, date, holidays);
          const holiday = holidays.getHolidayName(date);
          const day = weekday(date);
          const color = holiday || day === 0 ? t.red : day === 6 ? t.blue : t.text;
          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityLabel={
                date +
                ' ' +
                weekdays[day] +
                '요일' +
                (holiday ? ', ' + holiday : '') +
                ', ' +
                entries.map((e) => e.content).join(', ') +
                ', 편집'
              }
              onPress={() => setEditing(date)}
              onLayout={(e) => {
                positions.current.set(date, e.nativeEvent.layout.y);
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'flex-start',
                minHeight: 60,
                paddingVertical: 15,
                paddingHorizontal: 8,
                borderRadius: 8,
                backgroundColor: date === localToday || pressed ? t.selected : 'transparent',
              })}
            >
              <View
                style={{ width: 60 * fontScale, flexDirection: 'row', gap: 7, paddingRight: 6 }}
              >
                <Text
                  style={{
                    color,
                    fontSize: 17,
                    lineHeight: 27,
                    width: 25 * fontScale,
                    textAlign: 'right',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {Number(date.slice(8))}
                </Text>
                <Text style={{ color, fontSize: 16, lineHeight: 27 }}>{weekdays[day]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 17, lineHeight: 27 }}>
                  {entries.map((e) => e.content).join(', ')}
                </Text>
                {holiday ? (
                  <Text style={{ color: t.muted, fontSize: 12, marginTop: 4 }}>{holiday}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      {editing ? (
        <DayEditor
          date={editing}
          onDate={(date) => {
            setEditing(date);
            showDate(date);
          }}
          onClose={() => {
            showDate(editing);
            setEditing(null);
          }}
        />
      ) : null}
      {menu ? (
        <Sheet
          title={menu === 'menu' ? '용플래너' : monthLabel(month) + ' 내보내기'}
          onClose={() => setMenu(null)}
          scroll
        >
          {menu === 'menu' ? (
            <>
              <Button
                title="반복 일정 관리"
                onPress={() => {
                  setMenu(null);
                  router.push('/recurring');
                }}
              />
              <Button
                title="설정 및 백업"
                onPress={() => {
                  setMenu(null);
                  router.push('/settings');
                }}
              />
            </>
          ) : (
            <>
              <Button
                title="TXT 파일 공유"
                onPress={() => {
                  void doExport('txt');
                }}
              />
              <Button
                title="CSV 파일 공유"
                onPress={() => {
                  void doExport('csv');
                }}
              />
              <Button
                title="클립보드 복사"
                onPress={() => {
                  void doExport('clipboard');
                }}
              />
            </>
          )}
        </Sheet>
      ) : null}
    </SafeAreaView>
  );
}
