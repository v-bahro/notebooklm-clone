import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNotebookDto {
  @IsString()
  @IsNotEmpty({ message: 'Titel darf nicht leer sein.' })
  @MaxLength(200, { message: 'Titel darf maximal 200 Zeichen lang sein.' })
  title: string;
}
