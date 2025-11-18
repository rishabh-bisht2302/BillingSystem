import { Injectable } from '@nestjs/common';
import { 
  config 
} from "./config/constants";
import {
  IProjectInfo
} from './interfaces/project-info.interface';
@Injectable()
export class AppService {
  getProjectDescription(): IProjectInfo {
    return config.projectInfo;
  }
}
