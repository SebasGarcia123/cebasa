import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { BrandPreset } from '../theme/brand-preset';
import { csrfInterceptor } from './core/auth/csrf.interceptor';
import { refreshInterceptor } from './core/auth/refresh.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // El scroll real de la app es el de la ventana (el .shell__content
    // interno no llega a recortar su alto pese al overflow-y:auto, ver
    // .shell en shell.scss), así que sin esto navegar desde un ítem del
    // menú más abajo dejaba la pantalla nueva con el scroll heredado de
    // la anterior. 'top' fuerza scroll arriba en cada navegación, a
    // diferencia de 'enabled' que restaura la posición por ruta.
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: BrandPreset,
        options: {
          darkModeSelector: '[data-theme="dark"]',
        },
      },
    }),
    provideHttpClient(withInterceptors([csrfInterceptor, refreshInterceptor])),
    ConfirmationService,
    MessageService,
  ],
};
