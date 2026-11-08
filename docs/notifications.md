# 알림·알람 연동 검토

현재 상태: 미연동. expo-notifications 미설치, 오프라인 설치는 ENOTCACHED로 실패. 패키지·잠금 파일은 미변경. 메뉴·예약·권한 요청의 실제 기능은 아직 제공하지 않음.

## 참고 구현

- C:/project/wip-application-v2/src/features/pill_reminder/services/pill_reminder_notification_permission_service.ts
- pill_reminder/data/datasources의 permission/channel/schedule 분리 참고.
- 참고 앱의 getExactAlarmPermissionStatus는 Android에서도 항상 true를 반환함. 실제 권한 확인으로 사용하면 안 됨.

## 최소 권한

| 기능           | Android                                                                           | iOS                               |
| -------------- | --------------------------------------------------------------------------------- | --------------------------------- |
| 오늘 일정 요약 | Android 13+ POST_NOTIFICATIONS; 채널 생성 후 요청                                 | 알림 alert 승인                   |
| 지정 시간 알림 | 일반 예약은 추가 정확 알람 권한 없음; OS 지연 가능                                | 로컬 알림 예약                    |
| 정시 보장 옵션 | Android 12+ SCHEDULE_EXACT_ALARM 특별 접근; 실제 canScheduleExactAlarms 확인 필요 | OS 집중 모드·알림 설정에 영향받음 |
| 소리           | 알람 활성화 때만 채널 소리 사용                                                   | 알람 활성화 때만 sound 승인       |

- 권한은 기능을 켤 때 요청. 거부 시 설정 이동 안내. 앱 시작 시 강제 요청하지 않음.
- Android는 알림 채널·sticky 요약 지원. 잠금화면 공개 여부는 사용자 선택과 OS 설정을 따름.
- iOS는 잠금화면·알림센터로 제공. Android 방식의 상태바 고정은 동일 구현 불가.
- 배지·위치·배터리 최적화 제외·전체 화면 Intent·DND 우회·백그라운드 원격 알림 권한은 기본 추가하지 않음.

## 후속 연결

1. 네트워크 가능한 환경에서 `npx expo install expo-notifications` 실행, Yarn 잠금 파일 갱신. SDK 58 호환 범위: ~58.1.7.
2. 알림 메뉴·설정, 네이티브 어댑터, 예약 조정 컨트롤러 연결. 요약과 시간 알람 채널 분리.
3. 일정 저장·삭제·시간 변경·복원·앱 복귀·날짜 변경 시 예약 갱신. OS 예약 수 제한에 맞춰 가까운 일정부터 등록.
4. 권한 거부·취소·재부팅·시간대 변경·잠금 상태를 iOS/Android 실제 빌드로 검증.

## 공식 문서

- [Expo SDK 58 Notifications](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/)
- [Android 알람·정확 알람 권한](https://developer.android.com/develop/background-work/services/alarms)
- [Apple 알림 권한](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications)
