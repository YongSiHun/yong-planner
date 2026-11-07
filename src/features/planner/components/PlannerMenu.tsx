import { router } from 'expo-router';
import { Button, Label, Sheet } from '../../../components/ui';
import { monthLabel } from '../../../utils/date';
import type { ExportFormat } from '../../../services/export/files';

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
    <Sheet title={title} onClose={onClose} scroll showHeader={false}>
      {isNavigationMenu ? (
        <>
          <Button title="내보내기" onPress={onShowExport} />
          <Button title="반복 일정 관리" onPress={() => handleNavigate('/recurring')} />
          <Button title="설정" onPress={() => handleNavigate('/settings')} />
        </>
      ) : (
        <>
          <Button title="카카오톡으로 공유" onPress={() => onExport('share')} />
          <Label muted style={{ fontSize: 12, textAlign: 'center' }}>
            공유 목록에서 카카오톡을 선택하세요.
          </Label>
          <Button title="내용 복사" onPress={() => onExport('clipboard')} />
          <Button title="TXT 파일 공유" onPress={() => onExport('txt')} />
          <Button title="CSV 파일 공유" onPress={() => onExport('csv')} />
        </>
      )}
    </Sheet>
  );
}
