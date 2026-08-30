import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const getCorsOptions = (): CorsOptions => {
  const rawCorsOrigin = process.env['CORS_ORIGIN'];
  const configuredOrigin = rawCorsOrigin && rawCorsOrigin.trim() !== '' ? rawCorsOrigin : 'http://localhost:4200/';
  const allowedOrigin = configuredOrigin.replace(/\/+$/, '');

  return {
    origin: (origin, callback) => {
      if (!origin || origin.replace(/\/+$/, '') === allowedOrigin) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,Accept'
  };
};
