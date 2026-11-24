import { Pipe, PipeTransform } from '@angular/core';

import { hostnameToUnicode } from './punycode';

@Pipe({ name: 'domain' })
export class DomainPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    try {
      const { hostname } = new URL(value);
      return hostname ? hostnameToUnicode(hostname) : value;
    } catch {
      return value;
    }
  }
}
