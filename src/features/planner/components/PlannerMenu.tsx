import { router } from 'expo-router';
import { Button, Sheet } from '../../../components/ui';
import { monthLabel } from '../../../utils/date';
import type { ExportFormat } from '../../../services/export/files';

export type PlannerMenuType = 'menu' | 'export';

interface PlannerMenuProps {
  type: PlannerMenuType;
  month: string;
  onClose(): void;
  onExport(format: ExportFormat): void;
}

export function PlannerMenu({ type, month, onClose, onExport }: PlannerMenuProps) {
  const isNavigationMenu = type === 'menu';
  const title = isNavigationMenu ? '용플래너' : monthLabel(month) + ' 내보내기';

  function handleNavigate(path: '/recurring' | '/settings') {
    onClose();
    router.push(path);
  }

  return (
    <Sheet title={title} onClose={onClose} scroll>
      {isNavigationMenu ? (
        <>
          <Button title="반복 일정 관리" onPress={() => handleNavigate('/recurring')} />
          <Button title="설정 및 백업" onPress={() => handleNavigate('/settings')} />
        </>
      ) : (
        <>
          <Button title="TXT 파일 공유" onPress={() => onExport('txt')} />
          <Button title="CSV 파일 공유" onPress={() => onExport('csv')} />
          <Button title="클립보드 복사" onPress={() => onExport('clipboard')} />
        </>
      )}
    </Sheet>
  );
}
