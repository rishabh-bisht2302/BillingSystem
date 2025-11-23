import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { IProjectInfo } from './interfaces/project-info.interface';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { RabbitMqService } from './message-queue/rabbitmq.service';

interface HealthCheckResult {
  status: string;
  timestamp: string;
  services: {
    database: {
      status: string;
      message?: string;
    };
    rabbitmq: {
      status: string;
      message?: string;
    };
  };
}

@ApiTags('Project Info and Health Check')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataSource: DataSource,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  @Get('project-info')
  getDescription(): IProjectInfo {
    return this.appService.getProjectDescription();
  }

  @Get('health')
  async getHealth(): Promise<HealthCheckResult> {
    const healthCheck: HealthCheckResult = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'down',
        },
        rabbitmq: {
          status: 'down',
        },
      },
    };

    // Check PostgreSQL Database
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        healthCheck.services.database.status = 'up';
        healthCheck.services.database.message = 'PostgreSQL is healthy';
      } else {
        healthCheck.services.database.message = 'Database not initialized';
        healthCheck.status = 'DEGRADED';
      }
    } catch (error) {
      healthCheck.services.database.status = 'down';
      healthCheck.services.database.message = `Database error: ${error.message}`;
      healthCheck.status = 'DEGRADED';
    }

    // Check RabbitMQ
    try {
      const isHealthy = await this.rabbitMqService.checkHealth();
      if (isHealthy) {
        healthCheck.services.rabbitmq.status = 'up';
        healthCheck.services.rabbitmq.message = 'RabbitMQ is healthy';
      } else {
        healthCheck.services.rabbitmq.status = 'down';
        healthCheck.services.rabbitmq.message = 'RabbitMQ is not connected';
        healthCheck.status = 'DEGRADED';
      }
    } catch (error) {
      healthCheck.services.rabbitmq.status = 'down';
      healthCheck.services.rabbitmq.message = `RabbitMQ error: ${error.message}`;
      healthCheck.status = 'DEGRADED';
    }

    return healthCheck;
  }
}
