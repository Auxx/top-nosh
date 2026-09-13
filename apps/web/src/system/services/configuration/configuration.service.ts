import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigurationValuesMap } from './configuration.types';

export * from './configuration.types';

/**
 * Service for fetching and updating configurations in batch from the frontend.
 */
@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  private readonly http = inject(HttpClient);

  /**
   * Retrieves values for a batch of configuration keys.
   *
   * @param keys - An array of configuration key strings.
   * @returns An Observable emitting the key-value dictionary.
   */
  readonly getConfigurations = (
    keys: string[]
  ): Observable<ConfigurationValuesMap> => this.http.post<ConfigurationValuesMap>('/configurations/retrieve', { keys });

  /**
   * Updates multiple configuration key-value pairs in batch.
   *
   * @param values - A dictionary of configuration keys mapped to their desired values (or null).
   * @returns An Observable emitting the updated key-value dictionary.
   */
  readonly updateConfigurations = (
    values: ConfigurationValuesMap
  ): Observable<ConfigurationValuesMap> => this.http.put<ConfigurationValuesMap>('/configurations', values);
}
