import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'domain' })
export class DomainPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    try {
      return new URL(value).hostname || value;
    } catch {
      return value;
    }
  }
}
