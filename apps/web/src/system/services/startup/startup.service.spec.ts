import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import * as envModule from '../../../environments/environment';
import { StartupService } from './startup.service';

describe('StartupService', () => {
  let mockHead: { appendChild: jest.Mock; };
  let mockDocument: {
    createElement: jest.Mock;
    head: { appendChild: jest.Mock; };
  };
  let createdElement: {
    setAttribute: jest.Mock;
  };

  beforeEach(() => {
    createdElement = {
      setAttribute: jest.fn()
    };

    mockHead = {
      appendChild: jest.fn()
    };

    mockDocument = {
      createElement: jest.fn().mockReturnValue(createdElement),
      head: mockHead
    };

    jest.spyOn(envModule, 'environment').mockReturnValue({
      production: false,
      apiUrl: 'http://localhost:3000',
      oidcEnabled: false
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const setupService = (): StartupService => {
    TestBed.configureTestingModule({
      providers: [
        StartupService,
        { provide: DOCUMENT, useValue: mockDocument }
      ]
    });

    return TestBed.inject(StartupService);
  };

  it('should create link element with rel manifest and correct href, then append to head', () => {
    setupService();

    expect(mockDocument.createElement).toHaveBeenCalledWith('link');
    expect(createdElement.setAttribute).toHaveBeenCalledWith('rel', 'manifest');
    expect(createdElement.setAttribute).toHaveBeenCalledWith('href', 'http://localhost:3000/manifest.webmanifest');
    expect(mockHead.appendChild).toHaveBeenCalledWith(createdElement);
  });

  it('should trim trailing slashes from apiUrl when constructing manifest href', () => {
    jest.spyOn(envModule, 'environment').mockReturnValue({
      production: false,
      apiUrl: 'http://localhost:3000/',
      oidcEnabled: false
    });

    setupService();

    expect(createdElement.setAttribute).toHaveBeenCalledWith('href', 'http://localhost:3000/manifest.webmanifest');
  });

  it('should trim multiple trailing slashes from apiUrl when constructing manifest href', () => {
    jest.spyOn(envModule, 'environment').mockReturnValue({
      production: false,
      apiUrl: 'https://api.example.com///',
      oidcEnabled: false
    });

    setupService();

    expect(createdElement.setAttribute).toHaveBeenCalledWith('href', 'https://api.example.com/manifest.webmanifest');
  });
});
