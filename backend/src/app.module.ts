import { Module } from '@nestjs/common';
import { ConfigSpaceController } from './config-space/config-space.controller';
import { ResultController } from './result/result.controller';
import { TaskController } from './task/task.controller';
import { ConfigSpaceService } from './config-space/config-space.service';
import { ResultService } from './result/result.service';
import { TaskService } from './task/task.service';

@Module({
  imports: [],
  controllers: [ConfigSpaceController, ResultController, TaskController],
  providers: [ConfigSpaceService, ResultService, TaskService],
})
export class AppModule {}

