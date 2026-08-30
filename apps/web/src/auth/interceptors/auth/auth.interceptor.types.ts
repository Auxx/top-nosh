import { HttpContextToken } from '@angular/common/http';

export const HTTP_AUTH_ENABLED = new HttpContextToken<boolean>(() => true);
