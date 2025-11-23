import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { IProjectInfo } from './interfaces/project-info.interface';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { PAYMENT_REDIS_CLIENT } from './payment/payment.constants';

interface HealthCheckResult {
  status: string;
  timestamp: string;
  services: {
    database: {
      status: string;
      message?: string;
    };
    redis: {
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
    @Inject(PAYMENT_REDIS_CLIENT)
    private readonly redisClient: Redis,
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
        redis: {
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

    // Check Redis
    try {
      await this.redisClient.ping();
      healthCheck.services.redis.status = 'up';
      healthCheck.services.redis.message = 'Redis is healthy';
    } catch (error) {
      healthCheck.services.redis.status = 'down';
      healthCheck.services.redis.message = `Redis error: ${error.message}`;
      healthCheck.status = 'DEGRADED';
    }

    return healthCheck;
  }
}
