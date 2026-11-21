import { router } from 'expo-router';
import { Keyboard, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, useTheme } from '../../../components/ui';
import { PlannerDay } from '../components/PlannerDay';
import { PlannerDialogs } from '../components/PlannerDialogs';
import { PlannerFooter } from '../components/PlannerFooter';
import { PlannerHeader } from '../components/PlannerHeader';
import { usePlannerScreen } from '../hooks/usePlannerScreen';
import * as styles from './PlannerScreen.styles';

const NO_SELECTED_IDS: ReadonlySet<string> = new Set();

export default function PlannerScreen() {
  const theme = useTheme();
  const {
    timeFormat,
    error,
    currentDate,
    holidays,
    month,
    scrollRef,
    showDate,
    handleMonthChange,
    handleContentSizeChange,
    handleMeasure,
    handleViewportLayout,
    handleChipScrollLock,
    keyboardVisible,
    handleInputFocus,
    scheduleReveal,
    handleKeyboardScroll,
    guide,
    monthPickerOpen,
    setMonthPickerOpen,
    closePlannerEditor,
    menu,
    setMenu,
    dates,
    selection,
    dismissSelection,
    handleRetrySave,
    handleToday,
    handleExport,
  } = usePlannerScreen();

  return (
    <KeyboardAvoidingView
      style={styles.plannerScreenKeyboardAvoidingViewStyle(theme)}
      behavior="padding"
    >
      <Pressable accessible={false} onPress={dismissSelection} style={styles.surface}>
        <SafeAreaView
          style={styles.plannerScreenSafeAreaViewStyle(theme)}
          edges={['top', 'left', 'right', 'bottom']}
        >
          <View style={styles.frame}>
            <PlannerHeader
              month={month}
              onMonth={(amount) => {
                dismissSelection();
                handleMonthChange(amount);
              }}
              onChooseMonth={() => {
                dismissSelection();
                setMonthPickerOpen(true);
              }}
              onMenu={() => {
                dismissSelection();
                setMenu('menu');
              }}
              onSearch={() => {
                dismissSelection();
                Keyboard.dismiss();
                router.push('/search');
              }}
              onGuide={() => {
                dismissSelection();
                guide.openGuide();
              }}
            />
            {error ? (
              <Button compact title="저장 실패 · 다시 저장" danger onPress={handleRetrySave} />
            ) : null}
            <ScrollView
              key={month.slice(0, 7)}
              ref={scrollRef}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              bounces={false}
              overScrollMode="never"
              onLayout={(event) => {
                handleViewportLayout(event);
                scheduleReveal();
              }}
              onScroll={handleKeyboardScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.plannerScreenScrollViewContentContainerStyle()}
              onContentSizeChange={(width, height) => {
                handleContentSizeChange(width, height);
                scheduleReveal();
              }}
            >
              {dates.map((date) => (
                <PlannerDay
                  key={date}
                  date={date}
                  holidays={holidays}
                  timeFormat={timeFormat}
                  isToday={date === currentDate}
                  selectedIds={selection.selectedByDate.get(date) ?? NO_SELECTED_IDS}
                  selecting={selection.selectedByDate.has(date)}
                  copying={selection.copySource !== undefined}
                  copyTarget={selection.copyDates.has(date)}
                  copySourceDate={selection.copySource ? selection.copySourceDate : undefined}
                  onCopyDate={selection.toggleCopyDate}
                  onSelect={selection.toggle}
                  onOutsidePress={dismissSelection}
                  onChipScrollLock={handleChipScrollLock}
                  onMeasure={handleMeasure}
                  onInputFocus={handleInputFocus}
                  onInputLayout={scheduleReveal}
                />
              ))}
            </ScrollView>
            <View pointerEvents="box-none" style={styles.footerOverlay}>
              <PlannerFooter
                selection={selection}
                month={month}
                keyboardVisible={keyboardVisible}
                onToday={handleToday}
              />
            </View>
            <PlannerDialogs
              guide={guide}
              selection={selection}
              timeFormat={timeFormat}
              monthPickerOpen={monthPickerOpen}
              month={month}
              menu={menu}
              onCloseMonth={() => setMonthPickerOpen(false)}
              onChooseMonth={(date) => {
                Keyboard.dismiss();
                closePlannerEditor();
                setMonthPickerOpen(false);
                showDate(date);
              }}
              onCloseMenu={() => setMenu(null)}
              onShowExport={() => setMenu('export')}
              onExport={(format) => {
                void handleExport(format);
              }}
            />
          </View>
        </SafeAreaView>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
