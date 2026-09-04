import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HTTP_AUTH_ENABLED } from '../../../auth/interceptors/auth/auth.interceptor.types';
import { RecipeDetails } from '../../../recipes/models/recipe-details.types';

@Injectable({ providedIn: 'root' })
export class SharedDataService {
  private readonly http = inject(HttpClient);

  readonly getSharedRecipeById = (id: string): Observable<RecipeDetails> =>
    this.http.get<RecipeDetails>(`/share/recipe/${id}`, {
      context: new HttpContext().set(HTTP_AUTH_ENABLED, false)
    });
}
