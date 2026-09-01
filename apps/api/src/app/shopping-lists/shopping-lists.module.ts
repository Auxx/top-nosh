import { Module } from '@nestjs/common';
import { PrismaModule } from '@top-nosh/data-access';
import { ShoppingListsController } from './shopping-lists.controller';
import { ShoppingListsService } from './shopping-lists.service';

@Module({
  imports: [ PrismaModule ],
  controllers: [ ShoppingListsController ],
  providers: [ ShoppingListsService ],
  exports: [ ShoppingListsService ]
})
export class ShoppingListsModule {}
