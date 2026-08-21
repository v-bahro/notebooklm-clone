import { IsBoolean } from 'class-validator';

export class UpdateSourceDto {
  @IsBoolean()
  includedInChat: boolean;
}
