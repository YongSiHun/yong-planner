import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, design } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import type { ExportFormat } from '../../../services/export/files';
import { monthLabel } from '../../../utils/date';
import * as styles from './PlannerMenu.styles';

export type PlannerMenuType = 'menu' | 'export';

interface PlannerMenuProps {
  type: PlannerMenuType;
  month: string;
  onClose(): void;
  onShowExport(): void;
  onExport(format: ExportFormat): void;
}

export function PlannerMenu({ type, month, onClose, onShowExport, onExport }: PlannerMenuProps) {
  const isNavigationMenu = type === 'menu';
  const title = isNavigationMenu ? '메뉴' : monthLabel(month) + ' 내보내기';

  function handleNavigate(path: '/settings' | '/notifications' | '/notes') {
    onClose();
    router.push(path);
  }

  return (
    <Dialog
      title={title}
      onClose={onClose}
      showHeader={!isNavigationMenu}
      titleSize={design.type.title}
      maxWidth={isNavigationMenu ? design.layout.menuMaxWidth - 6 : undefined}
      paddingVertical={isNavigationMenu ? design.space.md - 3 : undefined}
    >
      <View style={styles.plannerMenuViewStyle}>
        {isNavigationMenu ? (
          <>
            <Button
              bold
              labelSize={design.type.action}
              style={styles.plannerMenuButtonStyle}
              title="내보내기"
              onPress={onShowExport}
            />
            <Button
              bold
              labelSize={design.type.action}
              style={styles.plannerMenuButtonStyle}
              title="메모"
              onPress={() => handleNavigate('/notes')}
            />
            <Button
              bold
              labelSize={design.type.action}
              style={styles.plannerMenuButtonStyle}
              title="알림"
              onPress={() => handleNavigate('/notifications')}
            />
            <Button
              bold
              labelSize={design.type.action}
              style={styles.plannerMenuButtonStyle}
              title="설정"
              onPress={() => handleNavigate('/settings')}
            />
          </>
        ) : (
          <>
            <Button
              bold
              labelSize={design.type.action}
              style={styles.plannerMenuButtonStyle}
              title="내용 복사"
              onPress={() => onExport('clipboard')}
            />
            <Button
              bold
              labelSize={design.type.action}
              style={styles.plannerMenuButtonStyle}
              title="TXT 파일 공유"
              onPress={() => onExport('txt')}
            />
            <Button
              bold
              labelSize={design.type.action}
              style={styles.plannerMenuButtonStyle}
              title="JSON 파일 공유"
              onPress={() => onExport('json')}
            />
            <Button
              bold
              labelSize={design.type.action}
              style={styles.plannerMenuButtonStyle}
              title="CSV 파일 공유"
              onPress={() => onExport('csv')}
            />
          </>
        )}
      </View>
    </Dialog>
  );
}
