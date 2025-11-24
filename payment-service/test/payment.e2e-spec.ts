import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Payment Service E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same validation pipe as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
          const formattedErrors = errors.map((error) => ({
            field: error.property,
            errors: Object.values(error.constraints || {}),
            value: error.value,
          }));
          
          return new BadRequestException({
            statusCode: 400,
            message: 'Validation failed',
            errors: formattedErrors,
          });
        },
      }),
    );

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // Clean up database connections
    if (dataSource) {
      await dataSource.destroy();
    }
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET) - should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('services');
          expect(res.body.services).toHaveProperty('database');
          expect(res.body.services).toHaveProperty('redis');
        });
    });
  });

  describe('Payment Initiation (/payment/initiate)', () => {
    const validPaymentDto = {
      orderId: 'order_test_12345',
      subscriptionId: 1,
      amount: 1000,
      planName: 'Premium Plan',
      planId: 1,
      gateway: 'razorpay',
    };

    describe('Success Cases', () => {
      it('should successfully initiate payment with valid data', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send(validPaymentDto)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('orderId');
            expect(res.body).toHaveProperty('paymentId');
            expect(typeof res.body.paymentId).toBe('number');
            expect(res.body.orderId).toEqual(expect.any(String));
            expect(res.body.orderId).toMatch(
              /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
            );
          });
      });

      it('should accept optional previousPlanId and actionType', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({
            ...validPaymentDto,
            orderId: 'order_optional_test',
            previousPlanId: 2,
            actionType: 'upgrade',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('orderId');
            expect(res.body).toHaveProperty('paymentId');
          });
      });

      it('should accept paypal as gateway', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({
            ...validPaymentDto,
            orderId: 'order_paypal_test',
            gateway: 'paypal',
          })
          .expect(201);
      });
    });

    describe('Validation Errors', () => {
      it('should reject empty request body', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({})
          .expect(400)
          .expect((res) => {
            expect(res.body).toHaveProperty('statusCode', 400);
            expect(res.body).toHaveProperty('message', 'Validation failed');
            expect(res.body).toHaveProperty('errors');
            expect(Array.isArray(res.body.errors)).toBe(true);
          });
      });

      it('should reject missing orderId', () => {
        const { orderId, ...invalidDto } = validPaymentDto;
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send(invalidDto)
          .expect(400)
          .expect((res) => {
            const orderIdError = res.body.errors.find((e: any) => e.field === 'orderId');
            expect(orderIdError).toBeDefined();
            expect(orderIdError.errors).toContain('Order ID is required');
          });
      });

      it('should reject orderId shorter than 5 characters', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({ ...validPaymentDto, orderId: 'abc' })
          .expect(400)
          .expect((res) => {
            const orderIdError = res.body.errors.find((e: any) => e.field === 'orderId');
            expect(orderIdError).toBeDefined();
            expect(orderIdError.errors).toContain('Order ID must be at least 5 characters long');
          });
      });

      it('should reject orderId longer than 100 characters', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({ ...validPaymentDto, orderId: 'a'.repeat(101) })
          .expect(400)
          .expect((res) => {
            const orderIdError = res.body.errors.find((e: any) => e.field === 'orderId');
            expect(orderIdError).toBeDefined();
            expect(orderIdError.errors).toContain('Order ID must not exceed 100 characters');
          });
      });

      it('should reject invalid subscriptionId (string)', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({ ...validPaymentDto, subscriptionId: 'invalid' })
          .expect(400)
          .expect((res) => {
            const subIdError = res.body.errors.find((e: any) => e.field === 'subscriptionId');
            expect(subIdError).toBeDefined();
            expect(subIdError.errors.some((e: string) => e.includes('number'))).toBe(true);
          });
      });

      it('should reject negative subscriptionId', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({ ...validPaymentDto, subscriptionId: -1 })
          .expect(400)
          .expect((res) => {
            const subIdError = res.body.errors.find((e: any) => e.field === 'subscriptionId');
            expect(subIdError).toBeDefined();
            expect(subIdError.errors).toContain('Subscription ID must be a positive number');
          });
      });

      it('should reject zero subscriptionId', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({ ...validPaymentDto, subscriptionId: 0 })
          .expect(400)
          .expect((res) => {
            const subIdError = res.body.errors.find((e: any) => e.field === 'subscriptionId');
            expect(subIdError).toBeDefined();
          });
      });

      it('should reject negative amount', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({ ...validPaymentDto, amount: -100 })
          .expect(400)
          .expect((res) => {
            const amountError = res.body.errors.find((e: any) => e.field === 'amount');
            expect(amountError).toBeDefined();
            expect(amountError.errors).toContain('Amount must be a positive number');
          });
      });

      it('should reject zero amount', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({ ...validPaymentDto, amount: 0 })
          .expect(400)
          .expect((res) => {
            const amountError = res.body.errors.find((e: any) => e.field === 'amount');
            expect(amountError).toBeDefined();
            expect(amountError.errors).toContain('Amount must be at least 1');
          });
      });

      it('should reject empty planName', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({ ...validPaymentDto, planName: '' })
          .expect(400)
          .expect((res) => {
            const planNameError = res.body.errors.find((e: any) => e.field === 'planName');
            expect(planNameError).toBeDefined();
            expect(planNameError.errors).toContain('Plan name is required');
          });
      });

      it('should reject planName shorter than 2 characters', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({ ...validPaymentDto, planName: 'A' })
          .expect(400)
          .expect((res) => {
            const planNameError = res.body.errors.find((e: any) => e.field === 'planName');
            expect(planNameError).toBeDefined();
            expect(planNameError.errors).toContain('Plan name must be at least 2 characters long');
          });
      });

      it('should reject planName longer than 200 characters', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({ ...validPaymentDto, planName: 'A'.repeat(201) })
          .expect(400)
          .expect((res) => {
            const planNameError = res.body.errors.find((e: any) => e.field === 'planName');
            expect(planNameError).toBeDefined();
            expect(planNameError.errors).toContain('Plan name must not exceed 200 characters');
          });
      });

      it('should reject invalid gateway', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({ ...validPaymentDto, gateway: 'stripe' })
          .expect(400)
          .expect((res) => {
            const gatewayError = res.body.errors.find((e: any) => e.field === 'gateway');
            expect(gatewayError).toBeDefined();
            expect(gatewayError.errors).toContain('Gateway must be either razorpay or paypal');
          });
      });

      it('should reject empty gateway', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({ ...validPaymentDto, gateway: '' })
          .expect(400)
          .expect((res) => {
            const gatewayError = res.body.errors.find((e: any) => e.field === 'gateway');
            expect(gatewayError).toBeDefined();
            expect(gatewayError.errors).toContain('Gateway is required');
          });
      });

      it('should reject negative previousPlanId', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({ ...validPaymentDto, previousPlanId: -1 })
          .expect(400)
          .expect((res) => {
            const prevPlanError = res.body.errors.find((e: any) => e.field === 'previousPlanId');
            expect(prevPlanError).toBeDefined();
            expect(prevPlanError.errors).toContain('Previous plan ID must be a positive number');
          });
      });

      it('should reject actionType longer than 50 characters', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({ ...validPaymentDto, actionType: 'a'.repeat(51) })
          .expect(400)
          .expect((res) => {
            const actionError = res.body.errors.find((e: any) => e.field === 'actionType');
            expect(actionError).toBeDefined();
            expect(actionError.errors).toContain('Action type must not exceed 50 characters');
          });
      });

      it('should reject non-whitelisted properties', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({ ...validPaymentDto, extraField: 'notAllowed' })
          .expect(400)
          .expect((res) => {
            expect(res.body.errors).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  field: 'extraField',
                  errors: expect.arrayContaining([
                    'property extraField should not exist',
                  ]),
                }),
              ]),
            );
          });
      });

      it('should reject multiple validation errors', () => {
        return request(app.getHttpServer())
          .post('/payment/initiate')
          .send({
            orderId: 'ab', // Too short
            subscriptionId: -1, // Negative
            amount: 0, // Zero
            planName: '', // Empty
            planId: 'invalid', // Not a number
            gateway: 'unknown', // Invalid
          })
          .expect(400)
          .expect((res) => {
            expect(res.body.errors.length).toBeGreaterThan(3);
          });
      });
    });
  });

  describe('Refund Initiation (/refund/initiate)', () => {
    const validRefundDto = {
      paymentId: 1,
      subscriptionId: 1,
      amount: 1000,
      reason: 'Customer requested refund',
      gateway: 'razorpay',
    };

    describe('Success Cases', () => {
      it('should successfully initiate refund with valid data', () => {
        return request(app.getHttpServer())
          .post('/refund/initiate')
          .send(validRefundDto)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('refundId');
            expect(res.body).toHaveProperty('status');
            expect(typeof res.body.refundId).toBe('number');
          });
      });

      it('should accept paypal as gateway', () => {
        return request(app.getHttpServer())
          .post('/refund/initiate')
          .send({ ...validRefundDto, gateway: 'paypal' })
          .expect(201);
      });
    });

    describe('Validation Errors', () => {
      it('should reject empty request body', () => {
        return request(app.getHttpServer())
          .post('/refund/initiate')
          .send({})
          .expect(400)
          .expect((res) => {
            expect(res.body).toHaveProperty('statusCode', 400);
            expect(res.body).toHaveProperty('message', 'Validation failed');
            expect(res.body).toHaveProperty('errors');
          });
      });

      it('should reject invalid paymentId', () => {
        return request(app.getHttpServer())
          .post('/refund/initiate')
          .send({ ...validRefundDto, paymentId: 'invalid' })
          .expect(400)
          .expect((res) => {
            const paymentIdError = res.body.errors.find((e: any) => e.field === 'paymentId');
            expect(paymentIdError).toBeDefined();
            expect(paymentIdError.errors.some((e: string) => e.includes('number'))).toBe(true);
          });
      });

      it('should reject negative paymentId', () => {
        return request(app.getHttpServer())
          .post('/refund/initiate')
          .send({ ...validRefundDto, paymentId: -1 })
          .expect(400)
          .expect((res) => {
            const paymentIdError = res.body.errors.find((e: any) => e.field === 'paymentId');
            expect(paymentIdError).toBeDefined();
            expect(paymentIdError.errors).toContain('Payment ID must be a positive number');
          });
      });

      it('should reject negative amount', () => {
        return request(app.getHttpServer())
          .post('/refund/initiate')
          .send({ ...validRefundDto, amount: -100 })
          .expect(400)
          .expect((res) => {
            const amountError = res.body.errors.find((e: any) => e.field === 'amount');
            expect(amountError).toBeDefined();
            expect(amountError.errors).toContain('Amount must be a positive number');
          });
      });

      it('should reject zero amount', () => {
        return request(app.getHttpServer())
          .post('/refund/initiate')
          .send({ ...validRefundDto, amount: 0 })
          .expect(400)
          .expect((res) => {
            const amountError = res.body.errors.find((e: any) => e.field === 'amount');
            expect(amountError).toBeDefined();
            expect(amountError.errors).toContain('Amount must be at least 1');
          });
      });

      it('should reject empty reason', () => {
        return request(app.getHttpServer())
          .post('/refund/initiate')
          .send({ ...validRefundDto, reason: '' })
          .expect(400)
          .expect((res) => {
            const reasonError = res.body.errors.find((e: any) => e.field === 'reason');
            expect(reasonError).toBeDefined();
            expect(reasonError.errors).toContain('Reason is required');
          });
      });

      it('should reject reason shorter than 5 characters', () => {
        return request(app.getHttpServer())
          .post('/refund/initiate')
          .send({ ...validRefundDto, reason: 'Test' })
          .expect(400)
          .expect((res) => {
            const reasonError = res.body.errors.find((e: any) => e.field === 'reason');
            expect(reasonError).toBeDefined();
            expect(reasonError.errors).toContain('Reason must be at least 5 characters long');
          });
      });

      it('should reject reason longer than 500 characters', () => {
        return request(app.getHttpServer())
          .post('/refund/initiate')
          .send({ ...validRefundDto, reason: 'A'.repeat(501) })
          .expect(400)
          .expect((res) => {
            const reasonError = res.body.errors.find((e: any) => e.field === 'reason');
            expect(reasonError).toBeDefined();
            expect(reasonError.errors).toContain('Reason must not exceed 500 characters');
          });
      });

      it('should reject invalid gateway', () => {
        return request(app.getHttpServer())
          .post('/refund/initiate')
          .send({ ...validRefundDto, gateway: 'stripe' })
          .expect(400)
          .expect((res) => {
            const gatewayError = res.body.errors.find((e: any) => e.field === 'gateway');
            expect(gatewayError).toBeDefined();
            expect(gatewayError.errors).toContain('Gateway must be either razorpay or paypal');
          });
      });

      it('should reject non-whitelisted properties', () => {
        return request(app.getHttpServer())
          .post('/refund/initiate')
          .send({ ...validRefundDto, extraField: 'notAllowed' })
          .expect(400)
          .expect((res) => {
            expect(res.body.errors).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  field: 'extraField',
                  errors: expect.arrayContaining([
                    'property extraField should not exist',
                  ]),
                }),
              ]),
            );
          });
      });
    });
  });

  describe('Project Info', () => {
    it('/project-info (GET) - should return project information', () => {
      return request(app.getHttpServer())
        .get('/project-info')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('description');
          expect(res.body).toHaveProperty('version');
        });
    });
  });
});

