import { Module } from '@nestjs/common';
import { ResultController } from './result/result.controller';
import { ResultService } from './result/result.service';
import { TaskModule } from './task/task.module';

@Module({
  imports: [TaskModule],
  controllers: [ResultController],
  providers: [ResultService],
})
export class AppModule {}

