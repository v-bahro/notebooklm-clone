import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { NotebooksModule } from './notebooks/notebooks.module';
import { SourcesModule } from './sources/sources.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'notebooklm'),
        password: config.get<string>('DB_PASSWORD', 'notebooklm'),
        database: config.get<string>('DB_NAME', 'notebooklm'),
        autoLoadEntities: true,
        // Nur für lokale Entwicklung/Testaufgabe: synchronize automatisch.
        // In echtem Produktivbetrieb würden Migrationen genutzt.
        synchronize: true,
      }),
    }),
    NotebooksModule,
    SourcesModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
