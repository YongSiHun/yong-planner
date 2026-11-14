import Feather from '@expo/vector-icons/Feather';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, design, Label, useTheme } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import * as styles from './PlannerGuide.styles';

function GuideStep({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();

  return (
    <View style={styles.guideStepViewStyle(theme)}>
      <Label style={styles.guideStepLabelStyle}>{title}</Label>
      {children}
    </View>
  );
}

export function PlannerGuide({
  onClose,
  dontShowAgain,
  onDontShowAgainChange,
}: {
  onClose(): void;
  dontShowAgain: boolean;
  onDontShowAgainChange(value: boolean): void;
}) {
  return (
    <Dialog
      title="사용 가이드"
      showsScrollIndicator={false}
      titleSize={design.type.title}
      onClose={onClose}
      footer={
        <GuideFooter onClose={onClose} checked={dontShowAgain} onChange={onDontShowAgainChange} />
      }
    >
      <View style={styles.guideContent}>
        <GuideStep title="1. 눌러서 작성">
          <Label muted style={styles.plannerGuideLabelStyle}>
            일정 칸이나 칩을 눌러 수정하세요. 자동으로 저장돼요.
          </Label>
        </GuideStep>
        <GuideStep title="2. 쉼표(,)나 엔터로 나누기">
          <SplitExample />
        </GuideStep>
        <GuideStep title="3. 일정 복사">
          <Label muted style={styles.plannerGuideLabelStyle}>
            {'칩 길게 누르기 > 일정 복사 > 날짜 선택 > 복사'}
          </Label>
          <Label muted style={styles.plannerGuideLabelStyle}>
            월을 넘겨서도 복사 가능해요.
          </Label>
        </GuideStep>
        <GuideStep title="4. 공유">
          <Label muted style={styles.plannerGuideLabelStyle}>
            우측 메뉴 → 내보내기에서 공유하거나 복사하세요.
          </Label>
        </GuideStep>
      </View>
    </Dialog>
  );
}

function SplitExample() {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces={false}
      contentContainerStyle={styles.splitExampleScrollViewContentContainerStyle}
    >
      <Text numberOfLines={1} style={styles.splitExampleTextStyle(theme)}>
        회의, 장보기, 운동
      </Text>
      <Feather name="arrow-right" size={16} color={theme.accent} />
      {['회의', '장보기', '운동'].map((item) => (
        <Text key={item} numberOfLines={1} style={styles.splitExampleTextStyle2(theme)}>
          {item}
        </Text>
      ))}
    </ScrollView>
  );
}

function GuideFooter({
  onClose,
  checked,
  onChange,
}: {
  onClose(): void;
  checked: boolean;
  onChange(value: boolean): void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.guideFooterViewStyle}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel="다시 보지 않음"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={styles.guideFooterPressableStyle}
      >
        <Feather name={checked ? 'check-square' : 'square'} size={22} color={theme.accent} />
        <Label style={styles.dontShowAgainLabel}>다시 보지 않음</Label>
      </Pressable>
      <Button title="일정 작성하기" bold onPress={onClose} style={styles.action} />
    </View>
  );
}
