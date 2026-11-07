import Feather from '@expo/vector-icons/Feather';

// 글꼴을 앱 번들에 포함해 오프라인에서도 같은 타이포그래피를 사용한다.
export const appFonts = {
  ...Feather.font,
  'Pretendard-Regular': require('../../../assets/fonts/Pretendard-Regular.ttf'),
  'Pretendard-Medium': require('../../../assets/fonts/Pretendard-Medium.ttf'),
  'Pretendard-SemiBold': require('../../../assets/fonts/Pretendard-SemiBold.ttf'),
  'Pretendard-Bold': require('../../../assets/fonts/Pretendard-Bold.ttf'),
};
