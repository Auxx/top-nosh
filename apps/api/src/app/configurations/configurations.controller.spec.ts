import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationsController } from './configurations.controller';
import { ConfigurationsService } from './configurations.service';
import { RetrieveConfigurationsDto } from './dto/retrieve-configurations.dto';
import { UpdateConfigurationsDto } from './dto/update-configurations.dto';

describe('ConfigurationsController', () => {
  let controller: ConfigurationsController;
  let service: {
    getMany: jest.Mock;
    updateMany: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getMany: jest.fn(),
      updateMany: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ ConfigurationsController ],
      providers: [
        {
          provide: ConfigurationsService,
          useValue: service
        }
      ]
    }).compile();

    controller = module.get<ConfigurationsController>(ConfigurationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('retrieveConfigurations (POST /retrieve)', () => {
    it('should delegate to service.getMany when passed an array of keys', async () => {
      const keys = [ 'files.storage.type', 'auth.token.secret' ];
      const mockResult = {
        'files.storage.type': 's3',
        'auth.token.secret': 'xyz'
      };
      service.getMany.mockResolvedValue(mockResult);

      const result = await controller.retrieveConfigurations(keys);

      expect(service.getMany).toHaveBeenCalledWith(keys);
      expect(result).toEqual(mockResult);
    });

    it('should delegate to service.getMany when passed RetrieveConfigurationsDto', async () => {
      const dto: RetrieveConfigurationsDto = {
        keys: [ 'files.storage.type' ]
      };
      const mockResult = { 'files.storage.type': 's3' };
      service.getMany.mockResolvedValue(mockResult);

      const result = await controller.retrieveConfigurations(dto);

      expect(service.getMany).toHaveBeenCalledWith(dto.keys);
      expect(result).toEqual(mockResult);
    });

    it('should throw BadRequestException if body is neither an array nor an object with keys', async () => {
      await expect(
        controller.retrieveConfigurations(null as unknown as RetrieveConfigurationsDto)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.retrieveConfigurations({} as unknown as RetrieveConfigurationsDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if any key is not a string', async () => {
      await expect(
        controller.retrieveConfigurations([ 123, 'valid.key.here' ] as unknown as string[])
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getConfigurations (GET /)', () => {
    it('should parse comma-separated query string and call getMany', async () => {
      const mockResult = { 'files.storage.type': 's3', 'app.name.title': 'Top Nosh' };
      service.getMany.mockResolvedValue(mockResult);

      const result = await controller.getConfigurations('files.storage.type, app.name.title');

      expect(service.getMany).toHaveBeenCalledWith([ 'files.storage.type', 'app.name.title' ]);
      expect(result).toEqual(mockResult);
    });

    it('should handle array query parameter', async () => {
      const mockResult = { 'files.storage.type': 's3' };
      service.getMany.mockResolvedValue(mockResult);

      const result = await controller.getConfigurations([ 'files.storage.type' ]);

      expect(service.getMany).toHaveBeenCalledWith([ 'files.storage.type' ]);
      expect(result).toEqual(mockResult);
    });

    it('should handle undefined query parameter gracefully', async () => {
      service.getMany.mockResolvedValue({});

      const result = await controller.getConfigurations();

      expect(service.getMany).toHaveBeenCalledWith([]);
      expect(result).toEqual({});
    });
  });

  describe('updateConfigurations (PUT /)', () => {
    it('should delegate to service.updateMany when passed a raw key-value dictionary', async () => {
      const body = {
        'files.storage.type': 's3',
        'app.theme.mode': 'dark'
      };
      service.updateMany.mockResolvedValue(body);

      const result = await controller.updateConfigurations(body);

      expect(service.updateMany).toHaveBeenCalledWith(body);
      expect(result).toEqual(body);
    });

    it('should delegate to service.updateMany when passed an UpdateConfigurationsDto with values', async () => {
      const dto: UpdateConfigurationsDto = {
        values: { 'files.storage.type': 'local' }
      };
      service.updateMany.mockResolvedValue(dto.values);

      const result = await controller.updateConfigurations(dto);

      expect(service.updateMany).toHaveBeenCalledWith(dto.values);
      expect(result).toEqual(dto.values);
    });

    it('should throw BadRequestException if body is null or an array', async () => {
      await expect(
        controller.updateConfigurations(null as unknown as Record<string, string | null>)
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.updateConfigurations([ 'invalid' ] as unknown as Record<string, string | null>)
      ).rejects.toThrow(BadRequestException);
    });

    it('should propagate ForbiddenException from service on protected keys', async () => {
      const body = { 'prisma.database.url': 'illegal' };
      service.updateMany.mockRejectedValue(
        new ForbiddenException('Configuration key is protected')
      );

      await expect(controller.updateConfigurations(body)).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
