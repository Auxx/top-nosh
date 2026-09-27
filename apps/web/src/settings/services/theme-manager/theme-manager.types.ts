import { OptionItem } from '../../../system/types/option-item';

export const THEME_COLOR_SCHEME_STORAGE_KEY = 'top-nosh-color-scheme';

export const allPalettes = [
  'chartreuse',
  'red',
  'green',
  'blue',
  'yellow',
  'cyan',
  'magenta',
  'orange',
  'spring-green',
  'azure',
  'violet',
  'rose'
] as const;

export type Palette = typeof allPalettes[number];

export const allColorSchemes = [ 'light-dark', 'light', 'dark' ] as const;

export type ColorScheme = typeof allColorSchemes[number];

export const availableThemes = (): OptionItem<Palette>[] => [
  { value: 'chartreuse', label: 'paletteChartreuse' },
  { value: 'red', label: 'paletteRed' },
  { value: 'green', label: 'paletteGreen' },
  { value: 'blue', label: 'paletteBlue' },
  { value: 'yellow', label: 'paletteYellow' },
  { value: 'cyan', label: 'paletteCyan' },
  { value: 'magenta', label: 'paletteMagenta' },
  { value: 'orange', label: 'paletteOrange' },
  { value: 'spring-green', label: 'paletteSpringGreen' },
  { value: 'azure', label: 'paletteAzure' },
  { value: 'violet', label: 'paletteViolet' },
  { value: 'rose', label: 'paletteRose' }
];

export const availableColorSchemes = (): OptionItem<ColorScheme>[] => [
  { value: 'light-dark', label: 'lightDark' },
  { value: 'light', label: 'light' },
  { value: 'dark', label: 'dark' }
];
