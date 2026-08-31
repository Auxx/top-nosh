import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import * as envModule from '../../../environments/environment';
import { baseUrlInterceptor } from './base-url.interceptor';

describe('baseUrlInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    jest.spyOn(envModule, 'environment').mockReturnValue({
      production: false,
      apiUrl: 'http://localhost:3000/api'
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([ baseUrlInterceptor ])),
        provideHttpClientTesting()
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    jest.restoreAllMocks();
  });

  it('should prepend base URL to relative URL with leading slash', done => {
    httpClient.get('/recipes').subscribe(response => {
      expect(response).toEqual({ success: true });
      done();
    });

    const req = httpTesting.expectOne('http://localhost:3000/api/recipes');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true });
  });

  it('should prepend base URL to relative URL without leading slash', done => {
    httpClient.get('recipes').subscribe(response => {
      expect(response).toEqual({ success: true });
      done();
    });

    const req = httpTesting.expectOne('http://localhost:3000/api/recipes');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true });
  });

  it('should normalize trailing slash on apiUrl when prepending relative URL', done => {
    jest.spyOn(envModule, 'environment').mockReturnValue({
      production: false,
      apiUrl: 'http://localhost:3000/api/'
    });

    httpClient.get('/recipes').subscribe(response => {
      expect(response).toEqual({ success: true });
      done();
    });

    const req = httpTesting.expectOne('http://localhost:3000/api/recipes');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true });
  });

  it('should not modify absolute HTTP URLs', done => {
    httpClient.get('http://other.org/api').subscribe(response => {
      expect(response).toEqual({ data: 'ok' });
      done();
    });

    const req = httpTesting.expectOne('http://other.org/api');
    expect(req.request.method).toBe('GET');
    req.flush({ data: 'ok' });
  });

  it('should not modify absolute HTTPS URLs', done => {
    httpClient.get('https://example.com/data').subscribe(response => {
      expect(response).toEqual({ data: 'ok' });
      done();
    });

    const req = httpTesting.expectOne('https://example.com/data');
    expect(req.request.method).toBe('GET');
    req.flush({ data: 'ok' });
  });

  it('should not modify protocol-relative URLs', done => {
    httpClient.get('//cdn.example.com/image.png').subscribe(response => {
      expect(response).toEqual({ data: 'ok' });
      done();
    });

    const req = httpTesting.expectOne('//cdn.example.com/image.png');
    expect(req.request.method).toBe('GET');
    req.flush({ data: 'ok' });
  });

  it('should handle empty relative URL path', done => {
    httpClient.get('').subscribe(response => {
      expect(response).toEqual({ data: 'ok' });
      done();
    });

    const req = httpTesting.expectOne('http://localhost:3000/api');
    expect(req.request.method).toBe('GET');
    req.flush({ data: 'ok' });
  });
});
