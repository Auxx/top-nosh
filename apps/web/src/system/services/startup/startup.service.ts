import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StartupService {
  private readonly document = inject(DOCUMENT);

  constructor() {
    this.injectManifestLink();
  }

  private readonly injectManifestLink = (): void => {
    const baseUrl = environment().apiUrl.replace(/\/+$/, '');
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'manifest');
    link.setAttribute('href', `${baseUrl}/manifest.webmanifest`);
    this.document.head.appendChild(link);
  };
}
