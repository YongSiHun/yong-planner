# 용플래너 · Yong Planner

## 개요

- Android/iOS · 오프라인 월간 플래너
- 일정 칩 · 반복 · 시간 · 공휴일 · 알림/알람
- 내용 복사 · TXT/CSV 출력 · 월별 JSON 백업 및 복원
- 규칙: [UI](docs/DESIGN.md) · [3-Tier](docs/3tier-code-convention.md)

## 기술 스택

- App: RN · Expo · Expo Router · TS
- Data: SQLite · Zustand · date-fns
- Font: Pretendard 1.3.9 · SIL OFL 1.1
- Tool: Node 22 · Yarn 1.22.22 · ESLint · Prettier · Husky · GHA · EAS
- Holiday: [date-holidays](https://github.com/commenthol/date-holidays) · commenthol 외 · ISC / CC BY 3.0

## 명령어

```sh
yarn install                # deps 설치
npx expo install --check    # SDK 호환 검사
npx expo install --fix --yarn # SDK 호환 보정
yarn start                  # dev 서버·캐시 초기화
yarn android                # Android 실행
yarn ios                    # iOS 실행
yarn prebuild               # Expo 설정에서 native 재생성
yarn apk                    # 로컬 APK 빌드
yarn ipa                    # 로컬 IPA 빌드
yarn submit-ipa ./app.ipa    # IPA 제출
yarn lint                   # lint 검사
yarn lint --fix             # lint 수정
yarn format                 # fmt 적용
yarn format:check           # fmt 검사
yarn typecheck              # TS 검사
yarn test                   # 회귀 테스트
```

## 알림

알림 화면 표시는 기본 ON, 잠금화면 표시는 기본 OFF다. iOS 잠금화면 표시는 기기 설정을 따른다. 칩별 알람은 시간을 지정한 뒤 알람 설정으로 켠다.

요약은 오늘과 다음 7일, 알람은 다음 30일 중 최대 60개를 예약한다. 일정 변경·앱 복귀 시 갱신하며 앱이 실행되지 않는 동안은 예약된 범위까지만 제공한다. 기기별 설정은 로컬 KV, 일정은 SQLite에 저장한다.

OS 권한·소리·잠금화면·재부팅 전달은 실제 Android/iOS 빌드에서 확인해야 한다.
