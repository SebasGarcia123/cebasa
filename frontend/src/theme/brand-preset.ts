import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Paleta de marca de Celulosa Baradero SA, generada a partir de
 * --e-global-color-primary (#85B81B) y --e-global-color-secondary (#AE1D84)
 * tomados del sitio institucional.
 *
 * contrastColor en light usa texto oscuro sobre el verde: blanco falla
 * WCAG AA (2.4:1) contra #85B81B, texto oscuro da 8.7:1.
 */
export const BrandPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f9fbf4',
      100: '#f0f6e4',
      200: '#ddebbf',
      300: '#c8df98',
      400: '#a7cc5b',
      500: '#85B81B',
      600: '#75a218',
      700: '#608413',
      800: '#4a670f',
      900: '#384d0b',
      950: '#253408',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#171717',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        surface: {
          0: '#ffffff',
          50: '#f2f2f4',
          100: '#e7e7ea',
          200: '#d3d3d8',
          300: '#b3b3bb',
          400: '#8c8c97',
          500: '#6f6f7a',
          600: '#5a5a63',
          700: '#4a4a52',
          800: '#333338',
          900: '#232326',
          950: '#171717',
        },
      },
      dark: {
        primary: {
          color: '{primary.400}',
          contrastColor: '#171717',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        surface: {
          0: '#ffffff',
          50: '#232326',
          100: '#2a2a2e',
          200: '#33353a',
          300: '#45474d',
          400: '#5a5a63',
          500: '#8c8c97',
          600: '#a0a4ab',
          700: '#c4c6ca',
          800: '#dcdde0',
          900: '#eeeef0',
          950: '#f2f2f4',
        },
      },
    },
  },
});
