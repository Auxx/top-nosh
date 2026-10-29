import { DynamicModule, Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { DataPermissionsReport } from '../data-permissions/data-permissions';
import { getStaticRootPath } from '../static-root';
import { DATA_PERMISSIONS_REPORT } from './data-permissions-report.token';
import { NeedsAttentionController } from './needs-attention.controller';

export { DATA_PERMISSIONS_REPORT };

@Module({})
export class NeedsAttentionModule {
  static forRoot(report: DataPermissionsReport): DynamicModule {
    return {
      module: NeedsAttentionModule,
      imports: [
        ServeStaticModule.forRoot({
          rootPath: getStaticRootPath(),
          exclude: [ '/api{/*path}' ]
        })
      ],
      controllers: [ NeedsAttentionController ],
      providers: [ { provide: DATA_PERMISSIONS_REPORT, useValue: report } ]
    };
  }
}
