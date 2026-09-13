import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const getCorsOptions = (): CorsOptions => {
  const isDevMode = process.env.SERVER_DEVELOPMENT_MODE === 'true';
  const rawCorsOrigin = isDevMode ? process.env.SERVER_DEVELOPMENT_DOMAIN : process.env.SERVER_HTTP_DOMAIN;
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
