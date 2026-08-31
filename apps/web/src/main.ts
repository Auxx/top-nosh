import { bootstrapApplication } from '@angular/platform-browser';
import { bakeEnv } from '@elemental-concept/env-bakery';
import { App } from './app/app';
import { appConfig } from './app/app.config';

bakeEnv(() => import('./environments/environment'), '/assets/app.properties')
  .then(() => bootstrapApplication(App, appConfig).catch(err => console.error(err)));
