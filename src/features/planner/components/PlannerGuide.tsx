import Feather from '@expo/vector-icons/Feather';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, design, Label, useTheme } from '../../../components/ui';

function GuideStep({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <View style={{ padding: 16, gap: 8, borderRadius: 12, backgroundColor: theme.selected }}>
      <Label style={{ fontSize: design.type.body, fontWeight: '600' }}>{title}</Label>
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
  const theme = useTheme();

  return (
    <Modal animationType="fade" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} accessibilityViewIsModal>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingTop: 8,
              width: '100%',
              maxWidth: 720,
              alignSelf: 'center',
            }}
          >
            <Label
              style={{ flex: 1, fontWeight: '600', fontSize: 17, marginTop: 4, paddingLeft: 8 }}
            >
              사용 가이드
            </Label>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="가이드 닫기"
              onPress={onClose}
              style={({ pressed }) => ({
                width: design.touchTarget,
                height: design.touchTarget,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: design.radius.small,
                backgroundColor: pressed ? theme.selected : 'transparent',
              })}
            >
              <Feather name="x" size={22} color={theme.muted} />
            </Pressable>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 20,
              gap: 16,
              width: '100%',
              maxWidth: 720,
              alignSelf: 'center',
            }}
          >
            <GuideStep title="1. 눌러서 작성">
              <Label muted style={{ fontSize: design.type.small, lineHeight: 21 }}>
                일정 칸이나 칩을 눌러 수정하세요. 자동으로 저장돼요.
              </Label>
            </GuideStep>
            <GuideStep title="2. 쉼표(,)로 나누기">
              <ScrollView
                horizontal
                bounces={false}
                contentContainerStyle={{ alignItems: 'center', gap: 6, paddingVertical: 2 }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: design.font.regular,
                    fontSize: design.type.small,
                    color: theme.muted,
                  }}
                >
                  회의, 장보기, 운동
                </Text>
                <Feather name="arrow-right" size={16} color={theme.accent} />
                {['회의', '장보기', '운동'].map((item) => (
                  <Text
                    key={item}
                    numberOfLines={1}
                    style={{
                      fontFamily: design.font.regular,
                      fontSize: design.type.small,
                      color: theme.text,
                      backgroundColor: theme.bg,
                      borderWidth: 1,
                      borderColor: theme.line,
                      borderRadius: design.radius.pill,
                      paddingHorizontal: 6,
                      paddingVertical: 5,
                    }}
                  >
                    {item}
                  </Text>
                ))}
              </ScrollView>
              <Label muted style={{ fontSize: design.type.small, lineHeight: 21 }}>
                백스페이스를 입력하면 칩의 내용을 수정할 수 있어요.
              </Label>
            </GuideStep>
            <GuideStep title="3. 공유와 복사">
              <Label muted style={{ fontSize: design.type.small, lineHeight: 21 }}>
                우측 메뉴 → 내보내기에서 공유하거나 복사하세요.
              </Label>
            </GuideStep>
          </ScrollView>
          <View
            style={{
              width: '100%',
              maxWidth: 720,
              alignSelf: 'center',
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 12,
              borderTopWidth: 1,
              borderTopColor: theme.line,
              gap: 4,
            }}
          >
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel="다시 보지 않음"
              accessibilityState={{ checked: dontShowAgain }}
              onPress={() => onDontShowAgainChange(!dontShowAgain)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                minHeight: design.touchTarget,
              }}
            >
              <Feather
                name={dontShowAgain ? 'check-square' : 'square'}
                size={22}
                color={theme.accent}
              />
              <Label style={{ fontSize: design.type.small }}>다시 보지 않음</Label>
            </Pressable>
            <Button
              title="일정 작성하기"
              onPress={onClose}
              textColor={theme.onAccent}
              style={{ backgroundColor: theme.accent }}
            />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
