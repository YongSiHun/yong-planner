export const light = {
  bg: '#F7FBFF',
  surface: '#EDF0F3',
  text: '#20344A',
  muted: '#566E87',
  line: '#DBE8F3',
  accent: '#1F6EAC',
  onAccent: '#FFFFFF',
  toggleThumb: '#FFFFFF',
  selected: '#E4F2FF',
  red: '#B5485B',
  blue: '#286DA5',
  scrim: '#00000066',
};
export const dark: typeof light = {
  bg: '#101E2D',
  surface: '#26313D',
  text: '#E5F2FF',
  muted: '#9CB4CC',
  line: '#2A4259',
  accent: '#8BCBFA',
  onAccent: '#102435',
  toggleThumb: '#FFFFFF',
  selected: '#1C3B55',
  red: '#F4A1AF',
  blue: '#8BC4F0',
  scrim: '#00000099',
};

export const palette = { light, dark };

export type Theme = typeof light;
