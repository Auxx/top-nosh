import { bootstrapApplication } from '@angular/platform-browser';
import { bakeEnv } from '@elemental-concept/env-bakery';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { needsAttentionConfig } from './app/needs-attention.config';
import { NeedsAttentionPage } from './system/pages/needs-attention/needs-attention.page';

bakeEnv(() => import('./environments/environment'), '/assets/app.properties')
  .then(() => import('./environments/environment'))
  .then(({ environment }) =>
    environment().dataNeedsAttention
      ? bootstrapApplication(NeedsAttentionPage, needsAttentionConfig)
      : bootstrapApplication(App, appConfig)
  )
  .catch(err => console.error(err));
