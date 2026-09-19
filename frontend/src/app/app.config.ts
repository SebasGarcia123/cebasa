import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
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
    provideRouter(routes),
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
