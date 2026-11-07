import { Label } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import { monthLabel } from '../../../utils/date';

export function DateInfo({ date, name, onClose }: { date: string; name: string; onClose(): void }) {
  return (
    <Dialog title={monthLabel(date) + ' ' + Number(date.slice(8)) + '일'} onClose={onClose}>
      <Label>{name}</Label>
    </Dialog>
  );
}
