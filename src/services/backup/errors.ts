const messages = {
  selection:
    '파일 선택기를 열지 못했거나 파일에 접근할 수 없습니다. 파일 앱에서 백업을 기기에 내려받은 뒤 다시 선택해 주세요.',
  read: '파일을 읽을 수 없습니다. 파일을 기기에 내려받거나 다운로드 또는 파일 앱의 접근 가능한 폴더로 옮긴 뒤 다시 선택해 주세요.',
  format:
    '복원할 수 있는 백업 파일이 아닙니다. 이 앱에서 내보낸 JSON 또는 전체 백업 ZIP 파일인지 확인해 주세요. 파일이 손상되었거나 지원하지 않는 버전일 수도 있습니다.',
  size: '백업 파일은 50MB 이하여야 합니다. 더 작은 백업 파일을 선택해 주세요.',
};

export class BackupRestoreError extends Error {
  constructor(reason: keyof typeof messages) {
    super(messages[reason]);
    this.name = 'BackupRestoreError';
  }
}

export function restoreErrorMessage(error: unknown): string {
  const knownError = error instanceof BackupRestoreError;

  if (knownError) {
    return error.message;
  }

  return '백업을 복원하지 못했습니다. 잠시 후 다시 시도해 주세요. 문제가 계속되면 앱을 다시 실행해 주세요.';
}
