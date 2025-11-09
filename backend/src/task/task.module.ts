import { Module, forwardRef } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TaskGateway } from './task.gateway';

@Module({
  controllers: [TaskController],
  providers: [TaskService, TaskGateway],
  exports: [TaskService, TaskGateway],
})
export class TaskModule {}

