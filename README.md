# 용플래너 · Yong Planner

메모장처럼 쓰는 Android/iOS 오프라인 월간 플래너.
쉼표로 구분하는 일정 칩·반복 일정·카카오톡 공유·내용 복사·TXT/CSV 내보내기·JSON 백업 지원.

화면 스타일과 입력 규칙은 [디자인 컨벤션](DESIGN.md)을 따른다.

## Stack

- App: RN · Expo · Expo Router · TS
- Data: SQLite · Zustand · date-fns
- Typography: Pretendard 1.3.9 (앱 번들 포함) · SIL OFL 1.1
- Tools: Yarn Classic 1.22.22 · ESLint · Prettier · Husky · GHA · EAS
- 공휴일: [date-holidays](https://github.com/commenthol/date-holidays) · commenthol 및 기여자 · ISC / CC BY 3.0

## Commands

```sh
yarn install                # 의존성 설치
npx expo install --check     # Expo SDK 패키지 호환성 확인
npx expo install --fix --yarn # Expo SDK 호환 버전으로 패키지 조정
yarn start                  # 캐시 초기화 후 개발 서버
yarn android                # Android 네이티브 실행
yarn ios                    # iOS 네이티브 실행
yarn prebuild               # 기존 네이티브 프로젝트에 설정 반영 (--no-clean)
yarn rebuild                # 네이티브 프로젝트 재생성
yarn apk                    # APK 로컬 빌드
yarn ipa                    # IPA 로컬 빌드
yarn submit-ipa ./app.ipa    # IPA 제출
yarn lint                   # ESLint
yarn format                 # 포맷 적용
yarn typecheck              # TS 검사
yarn test                   # 일정 조회·저장 회귀 테스트
```
