import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { IProjectInfo } from './interfaces/project-info.interface';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getDescription(): IProjectInfo {
    return this.appService.getProjectDescription();
  }

}
