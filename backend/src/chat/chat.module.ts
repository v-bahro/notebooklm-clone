import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { Notebook } from '../notebooks/notebook.entity';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Message } from './message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Notebook]), EmbeddingsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
