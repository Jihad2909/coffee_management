import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import Nora from '@primeuix/themes/Nora';
import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    providePrimeNG({
            license:'eyJpZCI6IjIxNTRjOTY4LTYxZDAtNDQxYi1hMGZlLTM4M2IwZDU4MDUwOSIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3OTIwNTQ0OTQsImV4cCI6MTgyMzU5MDQ5NH0.VJLJVkqVj1Xssn6ApzYwFml3nczl6asu8s8h42Oz6GlDBJ-uEJJ11dFKRfWd5TchHbeNQua6WQlMJj3ETsHZCQ',
            theme: {
                preset: Nora,
                options: {
                    prefix: 'p',
                    darkModeSelector: 'light',
                    cssLayer: false,
                    cssVariables: true
                }
            }
        })
  ]
};
