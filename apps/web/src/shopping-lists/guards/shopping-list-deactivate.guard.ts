import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';

export interface CanDeactivateComponent {
  canDeactivate: () => boolean | Observable<boolean> | Promise<boolean>;
}

export const canDeactivateShoppingList: CanDeactivateFn<CanDeactivateComponent> = component => {
  return component.canDeactivate ? component.canDeactivate() : true;
};
