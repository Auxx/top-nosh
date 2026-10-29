import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PrismaModule } from '@top-nosh/data-access';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigurationsModule } from './configurations/configurations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DebugModule } from './debug/debug.module';
import { FileManagementModule } from './file-management/file-management.module';
import { GalleriesModule } from './galleries/galleries.module';
import { RecipesModule } from './recipes/recipes.module';
import { SharingModule } from './sharing/sharing.module';
import { ShoppingListsModule } from './shopping-lists/shopping-lists.module';
import { getStaticRootPath } from './static-root';
import { UsersModule } from './users/users.module';
import { WebStartUpModule } from './web-start-up-module/web-start-up-module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: getStaticRootPath(),
      exclude: [ '/api{/*path}' ]
    }),
    PrismaModule,
    ConfigurationsModule,
    AuthModule,
    WebStartUpModule,
    DashboardModule,
    FileManagementModule,
    GalleriesModule,
    RecipesModule,
    DebugModule,
    SharingModule,
    ShoppingListsModule,
    UsersModule
  ],
  controllers: [ AppController ],
  providers: [ AppService ]
})
export class AppModule {}
