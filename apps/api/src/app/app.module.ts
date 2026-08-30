import { Module } from '@nestjs/common';
import { PrismaModule } from '@top-nosh/data-access';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RecipesModule } from './recipes/recipes.module';

@Module({
  imports: [ PrismaModule, AuthModule, RecipesModule ],
  controllers: [ AppController ],
  providers: [ AppService ]
})
export class AppModule {}
