import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardData } from './dashboard.service.types';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  readonly getDashboardData = (): Observable<DashboardData> => this.http.get<DashboardData>('/dashboard');
}
