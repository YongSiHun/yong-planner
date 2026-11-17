# 테스트

전체 검사는 저장소 루트에서 실행한다.

- `yarn test`: 모든 회귀 테스트
- `yarn test --suite=notes`: 메모 기능
- `yarn test --suite=planner/input`: 특정 테스트 파일
- `yarn test --suite=ui --suite=notifications`: 여러 영역
- `yarn test --test-name-pattern="restore"`: 이름으로 필터링

`--suite=`는 tests 아래 경로이며 확장자를 생략할 수 있다. 잘못된 경로로 아무 테스트도 실행되지 않으면 실패로 처리한다. Node의 테스트 옵션은 그대로 전달한다.

## 파일 책임

| 위치          | 검증 대상                                    |
| ------------- | -------------------------------------------- |
| build         | Android 실행 스크립트와 재시도               |
| data          | SQLite, 마이그레이션, 저장 큐, 백업·내보내기 |
| notes         | 메모 편집·선택·휴지통·검색 진입              |
| notifications | 알림 계획, 기기 어댑터, 권한, 동기화         |
| planner       | 일정 규칙, 입력·선택, 날짜별 표시 모델       |
| settings      | 설정 검증과 사용자 명령                      |
| ui            | 공통 모달, 비동기 실행, 키보드               |

기능별 파일 안에서 사용자 동작과 결과를 검증한다. 순수 알림 계획은 plan.test.cjs, 기기 예약의 차이 반영은 reconcile.test.cjs에서 각각 검증한다. 같은 버튼 목록이나 스타일 규칙은 공통 컴포넌트 테스트에서 한 번 검증한다.

## 공통 도우미

- support/test.cjs: TypeScript 로더 등록, strict assert, node:test API. 각 테스트의 첫 진입점이다.
- support/hooks.cjs: 상태·ref·메모·효과·해제를 유지하는 명시적 훅 하네스. render()로 다시 실행하며, 새 컴포넌트를 검증할 때는 reset(), 해제를 검증할 때는 unmount()를 사용한다. 입력 ref를 연결한 뒤 flushLayoutEffects()를 호출할 수도 있다.
- support/frames.cjs: 애니메이션 프레임 예약·취소·실행. 임의의 실제 시간 대기를 추가하지 않는다.
- support/mock-module.cjs: 호출 파일을 기준으로 모듈 경로를 해석하고 의존성을 대체한다. 각 테스트 파일은 Node의 별도 프로세스에서 실행된다.
- support/tree.cjs: 요소 탐색과 함수 컴포넌트 확장.
- support/planner.cjs, notifications.cjs: 해당 기능의 테스트 상태와 기기 의존성 설정.
- support/notification-plan.cjs: 부작용 없는 알림 계획 fixture.

훅 하네스와 요소 확장은 React Native 렌더러가 아니다. 실제 터치·키보드·네이티브 재마운트·화면 깜빡임 검증은 기기에서 별도로 수행한다. 타입 검사는 `yarn typecheck`, 코드 규칙은 `yarn lint`, 포맷은 `yarn format:check`로 검증한다.
