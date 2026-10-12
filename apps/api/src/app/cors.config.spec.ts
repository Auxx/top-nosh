import { getCorsOptions, getFrontendUrl } from './cors.config';

describe('CORS and Frontend URL Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SERVER_DEVELOPMENT_MODE;
    delete process.env.SERVER_DEVELOPMENT_DOMAIN;
    delete process.env.SERVER_HTTP_DOMAIN;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getFrontendUrl', () => {
    it('should return default localhost when no environment variables are set', () => {
      expect(getFrontendUrl()).toBe('http://localhost:4200');
    });

    it('should return default localhost when domain is empty or whitespace', () => {
      process.env.SERVER_HTTP_DOMAIN = '   ';
      expect(getFrontendUrl()).toBe('http://localhost:4200');
    });

    it('should return SERVER_HTTP_DOMAIN when not in dev mode', () => {
      process.env.SERVER_HTTP_DOMAIN = 'https://topnosh.example.com';
      expect(getFrontendUrl()).toBe('https://topnosh.example.com');
    });

    it('should strip single and multiple trailing slashes from domain', () => {
      process.env.SERVER_HTTP_DOMAIN = 'https://topnosh.example.com///';
      expect(getFrontendUrl()).toBe('https://topnosh.example.com');
    });

    it('should return SERVER_DEVELOPMENT_DOMAIN when SERVER_DEVELOPMENT_MODE is true', () => {
      process.env.SERVER_DEVELOPMENT_MODE = 'true';
      process.env.SERVER_DEVELOPMENT_DOMAIN = 'http://dev.topnosh.local:4200/';
      process.env.SERVER_HTTP_DOMAIN = 'https://prod.topnosh.com';

      expect(getFrontendUrl()).toBe('http://dev.topnosh.local:4200');
    });

    it('should ignore SERVER_DEVELOPMENT_DOMAIN when SERVER_DEVELOPMENT_MODE is false or unset', () => {
      process.env.SERVER_DEVELOPMENT_MODE = 'false';
      process.env.SERVER_DEVELOPMENT_DOMAIN = 'http://dev.topnosh.local:4200/';
      process.env.SERVER_HTTP_DOMAIN = 'https://prod.topnosh.com/';

      expect(getFrontendUrl()).toBe('https://prod.topnosh.com');
    });
  });

  describe('getCorsOptions', () => {
    it('should create CORS options using resolved frontend URL', done => {
      process.env.SERVER_HTTP_DOMAIN = 'https://topnosh.example.com';
      const corsOptions = getCorsOptions();

      expect(typeof corsOptions.origin).toBe('function');
      const originValidator = corsOptions.origin as (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
      ) => void;

      originValidator('https://topnosh.example.com', (err, allow) => {
        expect(err).toBeNull();
        expect(allow).toBe(true);

        originValidator('https://unauthorized.com', (err2, allow2) => {
          expect(err2).toBeNull();
          expect(allow2).toBe(false);
          done();
        });
      });
    });
  });
});
