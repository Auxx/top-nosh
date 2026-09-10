import { HttpContextToken } from '@angular/common/http';

export const HTTP_BASE_URL_ENABLED = new HttpContextToken<boolean>(() => true);
