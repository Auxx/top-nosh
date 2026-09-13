import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigurationService } from './configuration.service';
import { ConfigurationValuesMap } from './configuration.types';

describe('ConfigurationService', () => {
  let service: ConfigurationService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConfigurationService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ConfigurationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfigurations', () => {
    it('should post to /configurations/retrieve with requested keys and return values map', done => {
      const keys = [ 'files.storage.type', 'app.theme.mode' ];
      const mockResponse: ConfigurationValuesMap = {
        'files.storage.type': 's3',
        'app.theme.mode': null
      };

      service.getConfigurations(keys).subscribe({
        next: response => {
          expect(response).toEqual(mockResponse);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne('/configurations/retrieve');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ keys });
      req.flush(mockResponse);
    });
  });

  describe('updateConfigurations', () => {
    it('should put to /configurations with values dictionary and return updated map', done => {
      const payload: ConfigurationValuesMap = {
        'files.storage.type': 'local',
        'app.theme.mode': 'dark'
      };

      service.updateConfigurations(payload).subscribe({
        next: response => {
          expect(response).toEqual(payload);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne('/configurations');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(payload);
    });
  });
});
