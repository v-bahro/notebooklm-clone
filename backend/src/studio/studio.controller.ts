import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { StudioService } from './studio.service';

@Controller('notebooks/:notebookId/summary')
export class StudioController {
  constructor(private readonly studioService: StudioService) {}

  @Get()
  getSummary(@Param('notebookId') notebookId: string) {
    return this.studioService.getSummary(notebookId);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  summarize(@Param('notebookId') notebookId: string) {
    return this.studioService.summarize(notebookId);
  }
}
