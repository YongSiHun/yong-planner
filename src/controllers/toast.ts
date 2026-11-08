import { useToastStore } from '../stores/toast';

export function showToast(message: string): void {
  useToastStore.setState((state) => ({ message, revision: state.revision + 1 }));
}
