# 3계층 코드 컨벤션

참고: wip-application-v2의 3tier-code-convention.md. 이 앱에서는 UI, 제어·업무 로직, 데이터 접근으로 책임을 구분하고 조회와 명령을 분리한다.

| 계층                 | 위치                                                 | 책임                                                      |
| -------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| Presentation         | src/app, features/_/screens, components, _.styles.ts | 라우팅, 화면 조합, 사용자 이벤트, 원자적 상태 구독        |
| Application / Domain | features/\*/hooks, controllers, services, types      | 명령 조립, 초기화, 저장 순서, 검증, 일정 규칙과 표시 모델 |
| Data                 | database, stores, services/export/files.ts           | SQLite·마이그레이션·저장, Zustand 상태, OS 파일·공유 접근 |

stores는 데이터와 초기값만 보유한다. 저장 큐, 초기화, 복원과 일정 변경은 features/planner/controllers/planner.ts에 둔다. 외부 파일·공유 기능은 어댑터를 통해 사용한다. src/app의 화면 라우트는 feature 화면을 연결하며 공통 초기화는 usePlannerInit이 담당한다.

## 조회와 명령

- 컴포넌트는 필요한 값만 usePlanner(state => ...)로 직접 구독한다. 상위에서 전체 data를 구독해 전달하지 않는다.
- 날짜별 createDaySelector는 해당 날짜의 일정·순서·예외가 바뀔 때만 새 표시 모델을 만든다. 다른 날짜는 객체 참조를 재사용한다.
- use\*Actions는 useState/useEffect/데이터 구독 없이 모듈에서 고정된 명령을 재사용한다. 새 래퍼를 만들 경우 useCallback으로 참조를 고정한다. 최신 상태는 이벤트 시점의 getState()로 조회한다.
- 공유 선택 상태는 stores/noteSelection.ts에 둔다. useNoteSelection은 조회 모델, useSelectionActions는 명령을 담당한다.
- 입력·드래그·백업 진행 상태는 전용 UI 상태 훅에 둔다. 순수 액션 훅과 섞지 않는다.

## SRP와 OCP

- 화면은 액션 훅과 공통 props 계약에 의존한다. Footer·Dialogs·Day·Preview의 계약은 types/presentation.ts에 두고 다른 컴포넌트의 구현 타입을 추출하지 않는다.
- 컴포넌트 조합을 위한 import는 허용한다. 형제 컴포넌트의 내부 상태나 구현 메서드를 직접 호출하지 않는다. 이벤트는 콜백으로 전달한다.
- ScheduleInput은 렌더링, useScheduleInputState는 네이티브 입력 동기화, NoteInputEvents는 중복 이벤트 보정, note/time 서비스는 순수 일정 규칙을 담당한다.
- 드래그 세션은 이동 중 좌표만 변경한다. 놓았을 때 한 번 순서를 저장하며 취소는 데이터를 바꾸지 않는다.
- 내보내기는 형식별 전략 레지스트리로 확장한다. 새 형식을 추가할 때 중앙 분기문을 늘리지 않는다.
- 데이터 계층은 UI를 import하지 않는다. UI는 DB·컨트롤러를 직접 import하지 않고 액션 훅을 통해 명령을 실행한다.

## 스타일과 품질

- 스타일은 같은 이름의 \*.styles.ts에서 import한다. 정적 스타일은 모듈 상수로 재사용하고 상태별 스타일은 필요한 값만 받는 함수로 만든다.
- 색상·폰트·크기는 [디자인 컨벤션](DESIGN.md)의 palette.ts·tokens.ts를 사용한다. 스타일 파일은 컴포넌트를 import하지 않는다.
- 인지 복잡도는 함수당 4 이하로 제한한다. 5 이상이면 책임을 나눈다. 중첩 if는 early return으로, 중첩 반복문은 Map/Set 인덱스나 순차 순회로 바꾼다.
- ESLint가 복잡도, 중첩 if/반복문, 인라인 스타일, 계층 경계, 액션 훅의 상태·생명주기 구독을 검사한다.
- 변경 후 typecheck, lint, format:check와 관련 회귀 테스트를 실행한다. 네이티브 변경은 Android/iOS 번들도 확인하며 실제 터치·키보드 검증 여부를 구분해 기록한다.
