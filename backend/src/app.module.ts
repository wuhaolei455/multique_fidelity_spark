import { Module } from '@nestjs/common';
import { ConfigSpaceController } from './config-space/config-space.controller';
import { ResultController } from './result/result.controller';
import { ConfigSpaceService } from './config-space/config-space.service';
import { ResultService } from './result/result.service';

@Module({
  imports: [],
  controllers: [ConfigSpaceController, ResultController],
  providers: [ConfigSpaceService, ResultService],
})
export class AppModule {}

