import { design } from '../../../components/ui/tokens';

export const container = {
  backgroundColor: '#505050',
  borderTopWidth: 1,
  borderTopColor: '#707070',
  width: '100%',
  flexShrink: 0,
  paddingTop: 16,
  paddingBottom: 30,
} as const;
export const viewport = { width: '100%', flexGrow: 0, flexShrink: 0 } as const;
export const actions = {
  flexDirection: 'row',
  alignItems: 'stretch',
  flexGrow: 1,
  gap: 8,
  paddingHorizontal: 16,
} as const;
export const action = {
  minHeight: 66,
  minWidth: 64,
  flexGrow: 1,
  flexShrink: 0,
  paddingHorizontal: 8,
  paddingVertical: 10,
  borderRadius: design.radius.small,
  backgroundColor: '#626262',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
} as const;
export const label = {
  color: '#eeeeee',
  fontFamily: design.font.regular,
  fontSize: design.type.small,
  textAlign: 'center',
} as const;

export function actionState(disabled: boolean) {
  return ({ pressed }: import('react-native').PressableStateCallbackType) => {
    const activeOpacity = pressed ? 0.7 : 1;

    return [action, { opacity: disabled ? 0.4 : activeOpacity }];
  };
}
