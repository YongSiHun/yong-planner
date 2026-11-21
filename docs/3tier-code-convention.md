# 3계층 코드 컨벤션

참고: wip-application-v2의 3tier-code-convention.md. 이 앱에서는 UI, 제어·업무 로직, 데이터 접근으로 책임을 구분하고 조회와 명령을 분리한다.

| 계층                 | 위치                                                 | 책임                                                      |
| -------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| Presentation         | src/app, features/_/screens, components, _.styles.ts | 라우팅, 화면 조합, 사용자 이벤트, 원자적 상태 구독        |
| Application / Domain | features/\*/hooks, controllers, services, types      | 명령 조립, 초기화, 저장 순서, 검증, 일정 규칙과 표시 모델 |
| Data                 | database, stores, data, features/\*/data             | SQLite·마이그레이션·저장, Zustand 상태, OS 파일·공유 접근 |

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
- ScheduleInput은 칩·입력창 조합만 담당한다. ScheduleTextField는 네이티브 입력과 높이 측정, ScheduleInputChip은 memo 단위의 표시, useScheduleInputState는 이벤트 연결, ScheduleEditSession은 순수 편집 규칙, useScheduleDraft는 저장 수명, useScheduleChipLayout은 터치 좌표를 담당한다. 각 표시 컴포넌트의 스타일은 같은 이름의 styles 파일에 둔다.
- 드래그 세션은 길게 누른 시점에 부모 스크롤을 잠그고, 이동 중 좌표만 변경한다. 놓았을 때 한 번 순서를 저장하며 취소는 데이터를 바꾸지 않는다. 종료·취소·마운트 해제는 모두 스크롤 잠금을 해제한다.
- 내보내기는 형식별 전략 레지스트리로 확장한다. 새 형식을 추가할 때 중앙 분기문을 늘리지 않는다.
- 데이터 계층은 UI를 import하지 않는다. UI는 DB·컨트롤러를 직접 import하지 않고 액션 훅을 통해 명령을 실행한다.

## 스타일과 품질

- 스타일은 같은 이름의 \*.styles.ts에서 import한다. 정적 스타일은 모듈 상수로 재사용하고 상태별 스타일은 필요한 값만 받는 함수로 만든다.
- 색상·폰트·크기는 [디자인 컨벤션](DESIGN.md)의 palette.ts·tokens.ts를 사용한다. 스타일 파일은 컴포넌트를 import하지 않는다.
- 인지 복잡도는 함수당 4 이하로 제한한다. 5 이상이면 책임을 나눈다. 중첩 if는 early return으로, 중첩 반복문은 Map/Set 인덱스나 순차 순회로 바꾼다.
- ESLint가 복잡도, 중첩 if/반복문, 인라인 스타일, 계층 경계, 액션 훅의 상태·생명주기 구독을 검사한다.
- 변경 후 typecheck, lint, format:check와 관련 회귀 테스트를 실행한다. 네이티브 변경은 Android/iOS 번들도 확인하며 실제 터치·키보드 검증 여부를 구분해 기록한다.

## 공통 UI와 테스트

- components/ui/index.tsx는 공개 API를 내보내는 배럴이며 Button·Input·Label·테마는 각 모듈에서 구현한다. UI 원시 요소는 배럴을 역으로 import하지 않는다.
- 삭제 확인은 services/confirmation.ts의 요청 규칙과 공통 ConfirmationDialog를 사용한다. 개별 기능은 대상·개수·후속 동작만 전달한다.
- 메모 화면은 헤더·목록·편집을 조합한다. 편집과 선택 상태는 각각의 훅이 관리하고 types/presentation.ts의 표시 계약을 사용한다.
- 비동기 UI 작업의 실행 잠금·오류 보고는 useAsyncOperation에서 관리하고, 실제 저장과 후속 처리는 기능별 훅에 둔다.
- 테스트 실행과 공통 도우미의 책임은 [tests/README.md](../tests/README.md)를 따른다.

## 일정 입력의 성능과 수명

- 일반 타이핑은 활성 텍스트만 검증한다. 하루 전체 직렬화는 stageDailyNote의 지연 공급자를 통해 디바운스 커밋·편집 종료·백그라운드 flush 시점에 수행한다. 도메인 검증은 컨트롤러의 실제 커밋에서도 수행한다.
- 칩 snapshot과 비활성 entry 참조는 일반 타이핑에서 유지한다. 삽입·삭제는 안정적인 entry key를 사용하므로 뒤쪽 칩을 다시 마운트하지 않는다. 높이 변화는 ScheduleTextField에서만 상태를 갱신한다.
- 콤마 확정·칩 전환은 네이티브 세션 번호를 변경한다. 이전 세션의 change·blur와 역순 eventCount는 무시한다. 커서 위치를 렌더 후 강제로 덮어쓰지 않는다. 포커스 복귀 시 예약된 blur를 취소한다.
- Unicode 길이는 코드 포인트 순회로 계산하며 배열을 만들지 않는다. 개별 항목이 255자를 넘으면 즉시 중단한다. 대량 붙여넣기에서 빈 구분자는 칩으로 쌓지 않는다.
- 같은 날짜의 변경되지 않은 저장 항목도 객체 참조를 재사용한다. 시간 변경·제거로 기존 알람 시간이 달라지면 알람을 해제한다.

## 계층 경계와 외부 입력

- 파일·공유·문서 선택은 data/export/files.ts에 있고 화면은 services/export/types.ts의 형식 계약에만 의존한다. 알림 응답 구독과 OS 설정 명령은 notifications/controllers를 거친다.
- services는 UI·저장소·컨트롤러·외부 IO를 런타임 의존성으로 import하지 않는다. ESLint와 tests/architecture가 역방향 의존을 검사한다.
- SQL 값은 바인딩하고 백업은 복원 전에 검증한다. ZIP은 압축 해제 전 크기 상한·정수 여부, 목록 경계, 압축 결과 크기와 CRC를 확인한다. 공유 파일명은 경로 구분자·제어 문자를 거부한다.
- `yarn benchmark:input`은 10/1,000/10,000개 일정에서 일반 입력 경로의 JS 비용을 비교한다. 네이티브 프레임률·키보드·터치 정확도는 이 측정으로 대체하지 않는다.
