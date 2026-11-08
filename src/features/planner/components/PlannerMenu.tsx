import { router } from 'expo-router';
import { View } from 'react-native';
import { Button } from '../../../components/ui';
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

  function handleNavigate(path: '/recurring' | '/settings') {
    onClose();
    router.push(path);
  }

  return (
    <Dialog title={title} onClose={onClose} showHeader={false}>
      <View style={styles.plannerMenuViewStyle}>
        {isNavigationMenu ? (
          <>
            <Button style={styles.plannerMenuButtonStyle} title="내보내기" onPress={onShowExport} />
            <Button
              style={styles.plannerMenuButtonStyle}
              title="반복 일정 관리"
              onPress={() => handleNavigate('/recurring')}
            />
            <Button
              style={styles.plannerMenuButtonStyle}
              title="설정"
              onPress={() => handleNavigate('/settings')}
            />
          </>
        ) : (
          <>
            <Button
              style={styles.plannerMenuButtonStyle}
              title="카카오톡으로 공유"
              onPress={() => onExport('share')}
            />
            <Button
              style={styles.plannerMenuButtonStyle}
              title="내용 복사"
              onPress={() => onExport('clipboard')}
            />
            <Button
              style={styles.plannerMenuButtonStyle}
              title="TXT 파일 공유"
              onPress={() => onExport('txt')}
            />
            <Button
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
