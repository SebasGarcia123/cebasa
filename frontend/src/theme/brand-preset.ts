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
        // La rampa tiene que ir de claro (50) a oscuro (950) en los DOS
        // esquemas: los componentes de Aura arman su propio contraste con
        // "light-dark({surface.0}, {surface.900})" (blanco en claro, el
        // escalón 900 en oscuro) — necesitan que 900/950 sea oscuro. Una
        // versión anterior invertía esta rampa para que "se leyera" como
        // dark theme a simple vista, pero eso hacía que surface.900
        // resolviera a un tono CLARO en modo oscuro: tablas y overlays
        // terminaban con fondo Y texto claros (ambos ilegibles).
        surface: {
          0: '#ffffff',
          50: '#f2f2f4',
          100: '#eeeef0',
          200: '#dcdde0',
          300: '#c4c6ca',
          400: '#a0a4ab',
          500: '#8c8c97',
          600: '#5a5a63',
          700: '#45474d',
          800: '#33353a',
          900: '#2a2a2e',
          950: '#232326',
        },
      },
    },
  },
});
