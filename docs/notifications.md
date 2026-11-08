# 알림·알람

## 동작

- 햄버거 > 알림 > 표시: 알림 화면에 표시 / 잠금 화면에 표시.
- 칩 길게 누름 > 알람 설정: 선택한 일정의 시간·알람 지정. 복수 선택 지원.
- 알람 해제: 선택한 칩만 해제. 시간 입력만으로 자동 활성화하지 않음.
- 알림 탭: 해당 날짜로 이동.
- 요약: 오늘 즉시 표시 + 다음 7일 자정 예약.
- 알람: 다음 30일 중 가까운 시간순 예약. 전체 대기 알림 최대 60개.
- 일정·시간·정렬·반복·공휴일·복원 변경 시 1초 디바운스 후 변경분만 갱신.
- 앱 복귀·백그라운드 진입·실행 중 매분 갱신. 비활성 앱은 이미 예약한 범위까지만 제공.
- 기기 표시·권한 설정: KV 저장. 칩별 알람: SQLite schema 5·JSON 백업 v4 저장. 구버전 백업 v1~3 지원.
- 요약은 무음, 알람은 기본 알림음. Android 알람 채널의 sound 옵션은 생략하고 알림 content.sound는 true를 사용한다. 무음 모드·집중 모드·OS 채널 설정을 따름.

## 권한

| 항목        | Android                                              | iOS                             |
| ----------- | ---------------------------------------------------- | ------------------------------- |
| 알림 표시   | Android 13+ POST_NOTIFICATIONS                       | alert 승인                      |
| 알람 소리   | 알람 채널 기본음                                     | 앱 시작·알람 설정 시 sound 승인 |
| 정확한 알람 | SCHEDULE_EXACT_ALARM 특별 접근, 칩 알람 설정 시 요청 | 별도 요청 없음                  |
| 잠금화면    | 공개/숨김 채널 분리                                  | 기기 알림 설정에서 관리         |
| 재부팅 복원 | SDK의 RECEIVE_BOOT_COMPLETED                         | OS 로컬 예약                    |

앱 시작 시 채널 생성 후 알림 권한을 요청한다. 칩 알람 적용 전 권한을 재확인하며 이미 승인한 권한은 재요청하지 않는다. 정확한 알람은 SDK의 getExactAlarmPermissionsAsync/requestExactAlarmPermissionsAsync로 실제 상태를 확인한다. 권한 거부·취소 시 정확 알람은 일반 예약으로 전환한다. 앱의 알림 표시 권한이 없으면 예약하지 않는다. [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/), [Android 알람](https://developer.android.com/develop/background-work/services/alarms)

iOS는 잠금화면·알림센터로 표시하며 Android 상태바 고정과 동일하지 않다. APNs entitlement·remote-notification background mode·배지·critical alert는 추가하지 않는다. 소리·잠금화면 허용은 사용자의 기기 설정이 최종 결정한다. [Apple 알림 권한](https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications)

Android 저장소·오버레이·진동 권한은 제외했다. USE_EXACT_ALARM·전체 화면 Intent·DND 우회·배터리 최적화 제외는 추가하지 않았다. INTERNET은 기존 Expo 실행 환경에 유지한다.

## 계층

- UI: screens, hooks
- 제어: controllers/notifications.ts
- 도메인: services/plan.ts, reconcile.ts
- 연동: data/native.ts, preferences.ts
- 상태: src/stores/notifications.ts

wip-application-v2의 권한·채널·예약 분리를 참고했다. 참고 앱의 정확 알람 권한을 항상 true로 반환하는 코드는 사용하지 않았다.

## 검증·실행

예약 상한·중복 방지·부분 실패 대기·권한 거부/취소·기기별 설정·초기 알림 이동을 Node 회귀 테스트로 검증한다. OS 권한 대화상자·실제 소리·잠금화면·재부팅 전달은 기기 빌드 검증이 별도로 필요하다.

네이티브 모듈과 권한이 추가되어 JS 새로고침만으로 반영되지 않는다.

```sh
yarn prebuild
yarn android
# macOS: yarn ios
```
