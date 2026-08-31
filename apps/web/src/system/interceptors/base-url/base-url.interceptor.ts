import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const isAbsoluteUrl = (url: string): boolean => /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:)?\/\//i.test(url);

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (isAbsoluteUrl(req.url)) {
    return next(req);
  }

  const baseUrl = environment().apiUrl.replace(/\/+$/, '');
  const cleanPath = req.url.replace(/^\/+/, '');
  const resolvedUrl = cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl;

  return next(req.clone({ url: resolvedUrl }));
};
