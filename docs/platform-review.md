# 플랫폼 및 반응형 점검

## 적용한 조치

- iOS·Android 공통으로 입력은 TextInput의 onChange/eventCount를 처리한다. 키 입력과 텍스트 변경을 동시에 병합하지 않아 중복 칩 생성을 방지한다.
- Android는 adjustResize, iOS는 KeyboardAvoidingView를 사용한다. 가려진 입력창은 실제 겹친 높이만큼 스크롤한다.
- 공통 중앙 모달에 SafeAreaProvider를 적용해 별도 네이티브 화면의 안전 영역을 측정한다.
- 플래너 최대 너비 960, 설정 800, 표준 모달(메뉴·가이드 포함) 480으로 넓은 화면을 제한한다. 선택 작업 버튼은 좁은 화면에서 줄바꿈한다.
- 태블릿 지원과 회전을 허용한다. 폰트는 번들 Pretendard를 사용한다. 오늘 이동 버튼의 플랫폼별 그림자는 제거했다.
- 공유는 OS 공유 창을 사용한다. 카카오톡 표시 여부는 설치와 OS 공유 대상에 따른다. 파일 공유는 각 OS의 MIME/UTI 규칙을 사용한다. 설치된 React Native·Expo Sharing의 iOS 구현에서 iPad popover 기본 위치 처리를 확인했다.

## 검증 범위

자동 테스트로 입력 이벤트 순서·한글 수정·병합·복사·날짜 안내·시간 저장·기존 DB 업그레이드를 확인한다. 입력창 너비는 320/360/768/1024/1366과 글자 배율 1/1.4/2 조합에서 확인한다. 이는 실제 화면 렌더링 검증을 대체하지 않는다.

실기기에서는 iPhone/iPad 및 Android 폰/태블릿에서 세로·가로 회전, 한글 키보드 조합, 키보드 표시 중 스크롤, 길게 누르기, 공유 대상을 확인해야 한다. 현재 환경에서는 실기기 UI 검증을 수행하지 못했다.

## 참고

- [React Native TextInput](https://reactnative.dev/docs/textinput.html)
- [Expo Sharing](https://docs.expo.dev/versions/latest/sdk/sharing/)
- [SafeAreaProvider](https://github.com/AppAndFlow/react-native-safe-area-context/blob/main/docs/docs/api/safe-area-provider.mdx)
