import {
  buttonLabelSize,
  section,
  heading,
  filledButton,
} from '../../../components/ui/settings.styles';
import Constants from 'expo-constants';
import { useState } from 'react';
import { View } from 'react-native';
import fontNotice from '../../../../assets/fonts/NOTICE.json';
import { Button, Label, design, useTheme } from '../../../components/ui';
import { Dialog } from '../../../components/ui/Dialog';
import * as styles from './AppInfo.styles';

export function AppInfo() {
  const theme = useTheme();
  const [licenseOpen, setLicenseOpen] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <>
      <View style={section}>
        <Label style={heading}>앱 정보</Label>
        <Button
          labelSize={buttonLabelSize}
          style={filledButton(theme)}
          title={'용플래너 ' + version}
          accessibilityLabel={'용플래너 ' + version + ', 라이선스 정보 열기'}
          onPress={() => setLicenseOpen(true)}
        />
      </View>
      {licenseOpen ? (
        <Dialog
          titleSize={design.type.title}
          title="라이선스 정보"
          onClose={() => setLicenseOpen(false)}
        >
          <Label style={heading}>Pretendard</Label>
          <Label muted>{fontNotice.copyright}</Label>
          <Label muted style={styles.license}>
            {fontNotice.license}
          </Label>
          <Label style={heading}>공휴일 데이터</Label>
          <Label muted style={styles.attribution}>
            공휴일: date-holidays / commenthol · ISC 및 CC BY 3.0{'\n'}
            github.com/commenthol/date-holidays
          </Label>
        </Dialog>
      ) : null}
    </>
  );
}
