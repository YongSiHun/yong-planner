import Feather from '@expo/vector-icons/Feather';

// 번들 폰트: 오프라인 글꼴 통일.
export const appFonts = {
  ...Feather.font,
  'Pretendard-Regular': require('../../../assets/fonts/Pretendard-Regular.ttf'),
  'Pretendard-Medium': require('../../../assets/fonts/Pretendard-Medium.ttf'),
  'Pretendard-SemiBold': require('../../../assets/fonts/Pretendard-SemiBold.ttf'),
  'Pretendard-Bold': require('../../../assets/fonts/Pretendard-Bold.ttf'),
};
