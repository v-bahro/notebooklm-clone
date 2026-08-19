import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AskQuestionDto } from './dto/ask-question.dto';

@Controller('notebooks/:notebookId/messages')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  findAll(@Param('notebookId') notebookId: string) {
    return this.chatService.findAllByNotebook(notebookId);
  }

  @Post()
  ask(@Param('notebookId') notebookId: string, @Body() dto: AskQuestionDto) {
    return this.chatService.ask(notebookId, dto.question);
  }
}
