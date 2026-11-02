# 용플래너 · Yong Planner

메모장처럼 쓰는 Android/iOS 오프라인 월간 플래너.
일정 작성·반복·드래그 정렬·TXT/CSV 내보내기·JSON 백업 지원.

## Stack

- App: RN · Expo · Expo Router · TS
- Data: SQLite · Zustand · date-fns
- Tools: Yarn Classic 1.22.22 · ESLint · Prettier · Husky · GHA · EAS
- 공휴일: [date-holidays](https://github.com/commenthol/date-holidays) · commenthol 및 기여자 · ISC / CC BY 3.0

## Commands

```sh
yarn install                # 의존성 설치
yarn start                  # 캐시 초기화 후 개발 서버
yarn android                # Android 네이티브 실행
yarn ios                    # iOS 네이티브 실행
yarn prebuild               # 네이티브 프로젝트 생성
yarn rebuild                # 네이티브 프로젝트 재생성
yarn apk                    # APK 로컬 빌드
yarn ipa                    # IPA 로컬 빌드
yarn submit-ipa ./app.ipa    # IPA 제출
yarn lint                   # ESLint
yarn format                 # 포맷 적용
yarn typecheck              # TS 검사
```
