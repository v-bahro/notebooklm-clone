import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notebook } from '../notebooks/notebook.entity';
import { Source } from '../sources/source.entity';
import { StudioController } from './studio.controller';
import { StudioService } from './studio.service';

@Module({
  imports: [TypeOrmModule.forFeature([Source, Notebook])],
  controllers: [StudioController],
  providers: [StudioService],
})
export class StudioModule {}
