import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { webcrypto as nodeCrypto } from 'crypto';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { RabbitMqService } from '../src/message-queue/rabbitmq.service';
import { WebhookService } from '../src/webhook/webhook.service';
import { SubscriptionEntity } from '../src/subscription/subscription.schema';
import { PlanService } from '../src/plan/plan.service';
import { PlanEntity } from '../src/plan/plan.schema';
import { PaymentWebhookEvent } from '../src/payment/interfaces/payment.interface';
import { SubscriptionStatus } from '../src/subscription/interfaces/subscription.interface';


if (!(global as any).crypto) {
    (global as any).crypto = nodeCrypto;
}

jest.setTimeout(20000);
process.env.SUBSCRIPTION_JWT_SECRET = process.env.SUBSCRIPTION_JWT_SECRET ?? 'subscription-secret-key';
let adminToken: string;
let userToken: string;
let userId: number;
let createdPlanId: number;
let createdPlanName: string;
let createdPlanPrice: number;
let toBeDeletedUserId: number;
let pendingSubscriptionId: number;
let paymentId: number;
const uniqueEmail = `test-user-${Date.now()}@example.com`;
describe('Subscription Service E2E Tests', () => {
    let planService: PlanService;
    let app: INestApplication;
    let dataSource: DataSource;
    let subscriptionRepository: Repository<SubscriptionEntity>;
    let planRepository: Repository<PlanEntity>;

    const rabbitMqMock = {
        publish: jest.fn().mockResolvedValue(undefined),
        consume: jest.fn().mockResolvedValue(undefined),
        checkHealth: jest.fn().mockResolvedValue(true),
        onModuleDestroy: jest.fn().mockResolvedValue(undefined),
    };
    const webhookServiceMock = {
        initiatePayment: jest
        .fn()
        .mockResolvedValue({ orderId: 'order_mock_123', paymentId: 987 }),
        initiateRefund: jest.fn().mockResolvedValue(null),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule]
        })
        .overrideProvider(RabbitMqService)
        .useValue(rabbitMqMock)
        .overrideProvider(WebhookService)
        .useValue(webhookServiceMock)
        .compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        dataSource = moduleFixture.get(DataSource);
        subscriptionRepository = dataSource.getRepository(SubscriptionEntity);
        planRepository = dataSource.getRepository(PlanEntity);
        const adminResponse = await request(app.getHttpServer())
        .post('/auth/token')
        .expect(201)
        .expect((res) => {
            expect(res.body).toHaveProperty('accessToken');
        });
        adminToken = adminResponse.body.accessToken;

        const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send({
            email: uniqueEmail,
            password: 'Password123!',
        })
        .expect(201)
        .expect((res) => {
            expect(res.body).toHaveProperty('token.accessToken');
            expect(res.body).toHaveProperty('user.id');
        });

        userToken = loginResponse.body.token.accessToken;
        userId = loginResponse.body.user.id;
    });

    describe('Health Endpoint', () => {
        it('/health (GET) should report service status', async () => {
            await request(app.getHttpServer())
                .get('/health')
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('status');
                expect(res.body.services.database.status).toBeDefined();
                expect(res.body.services.rabbitmq.status).toBeDefined();
                });
        });
    });

    describe('Project Info', () => {
        it('/project-info (GET) should return metadata', async () => {
        await request(app.getHttpServer())
            .get('/project-info')
            .expect(200)
            .expect((res) => {
            expect(res.body).toHaveProperty('name');
            expect(res.body).toHaveProperty('description');
            expect(res.body).toHaveProperty('version');
            });
        });
    });

    //   admin route examples
    describe('Admin Routes', () => {
        it('should create a plan', async () => {
            createdPlanName = 'Artistic';
            const response = await request(app.getHttpServer())
                .post('/plans')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    planName: createdPlanName,
                    price: 1999,
                    validityInDays: 90,
                    isNew: true,
                    isPromotional: false,
                    descriptionOfPlan: 'Flgship subscription that offers features crafted for creators',
                })
                .expect(201);

            createdPlanId = response.body.id;
            createdPlanPrice = Number(response.body.price ?? 1999);
            expect(createdPlanId).toBeDefined();
            expect(createdPlanPrice).toBeGreaterThan(0);
        });
    });

    describe('Admin Routes', () => {
        it('should list of all the users for admin dashboard', async () => {
            await request(app.getHttpServer())
            .get('/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200)
            .expect((res) => {
                expect(res.body[0]).toHaveProperty('id');
                expect(res.body[0]).toHaveProperty('name');
                expect(res.body[0]).toHaveProperty('email');
                expect(res.body[0]).toHaveProperty('mobile');
                expect(res.body[0]).toHaveProperty('userType');
                expect(res.body[0]).toHaveProperty('age');
                expect(res.body[0]).toHaveProperty('bio');
                expect(res.body[0]).toHaveProperty('isActive');
            });
        })
    });

    describe('Admin Routes', () => {
        it('should create a user', async () => {
            await request(app.getHttpServer())
            .post('/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Test User',
                email: 'test@example.com',
                mobile: '1234567890',
                password: 'Password123!',
                userType: 'user',
                age: 30,
                bio: 'Test bio',
            })
            .expect(201)
            .expect((res) => {
                expect(res.body).toHaveProperty('id');
                expect(res.body.name).toBe('Test User');
                expect(res.body.email).toBe('test@example.com');
                expect(res.body.mobile).toBe('1234567890');
                expect(res.body.userType).toBe('user');
                expect(res.body.age).toBe(30);
                expect(res.body.bio).toBe('Test bio');
                toBeDeletedUserId = res.body.id;
            });
        });
    });

    describe('Admin Routes', () => {
        it('should update a user', async () => {
            await request(app.getHttpServer())
            .put(`/users/${toBeDeletedUserId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Test User',
            })
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('affected');
                expect(res.body.affected).toBe(1);
            });
        });
    });

    describe('Admin Routes', () => {
        it('should delete a user', async () => {
            await request(app.getHttpServer())
            .delete(`/users/${toBeDeletedUserId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('affected');
                expect(res.body.affected).toBe(1);
            });
        });
    });

    describe('Admin Routes', () => {
        it("Should return all subscriptions for admin dashboard", async () => {
            await request(app.getHttpServer())
            .get('/subscription/all')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200)
        });
    });


    describe('User Routes- Login Endpoint', () => {
        it('should reject login when email and mobile are missing', async () => {
        await request(app.getHttpServer())
            .post('/login')
            .send({
                password: 'Password123!',
            })
            .expect(400)
            .expect((res) => {
                expect(res.body.message).toBe('Either email or mobile is required');
            });
        });

        it('should reject login when email and mobile are missing', async () => {
            await request(app.getHttpServer())
            .post('/login')
            .send({
                email: uniqueEmail,
                password: 'Password123!',
            })
            .expect([200, 201])
            .expect((res) => {
                expect(res.body).toHaveProperty('user');
                expect(res.body).toHaveProperty('isProfileComplete');
                expect(res.body.isProfileComplete);
                expect(res.body).toHaveProperty('token');
                expect(res.body.token).toHaveProperty('accessToken');
                expect(res.body.token).toHaveProperty('expiresIn');
                expect(res.body.user).toHaveProperty('id');
                expect(res.body.user).toHaveProperty('name');
                expect(res.body.user).toHaveProperty('email');
                expect(res.body.user).toHaveProperty('mobile');
                expect(res.body.user).toHaveProperty('userType');
                expect(res.body.user).toHaveProperty('age');
                expect(res.body.user).toHaveProperty('bio');
                expect(res.body.user).toHaveProperty('isActive');
                expect(res.body.user).toHaveProperty('passwordHash');
            });
        });
    });


    describe('User Routes- Update profile', () => {
        it('should update user profile', async () => {
            await request(app.getHttpServer())
            .patch('/users/profile')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: 'Test User',
                bio: 'Updated bio',
                age: 30,
            })
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('id');
                expect(res.body).toHaveProperty('name');
                expect(res.body).toHaveProperty('bio');
                expect(res.body).toHaveProperty('age');
                expect(res.body).toHaveProperty('email');
                expect(res.body).toHaveProperty('mobile');
                expect(res.body).toHaveProperty('userType');
                expect(res.body).toHaveProperty('isActive');
                expect(res.body).toHaveProperty('updatedToken');
            });
        });
    });


    describe('User Routes- Get profile', () => {
        it('should return user profile', async () => {
            await request(app.getHttpServer())
            .get('/users/profile')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('user');
                expect(res.body).toHaveProperty('activeSubscription');
                expect(res.body.user).toHaveProperty('id');
                expect(res.body.user).toHaveProperty('name');
                expect(res.body.user).toHaveProperty('bio');
                expect(res.body.user).toHaveProperty('age');
                expect(res.body.user).toHaveProperty('email');
            });
        });
    });


    describe('User Routes- Deactivate account', () => {
        it('should deactivate user account', async () => {
            await request(app.getHttpServer())
            .patch('/users/deactivate')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('isActive');
                expect(res.body.isActive).toBe(false);
            });
        });
    });

    
    describe('User Routes- Reactivate account', () => {
        it('should relogin login user and activate user account', async () => {
            await request(app.getHttpServer())
            .post('/login')
            .send({
                email: uniqueEmail,
                password: 'Password123!',
            })
            .expect([200, 201])
            .expect((res) => {
                expect(res.body).toHaveProperty('user');
                expect(res.body).toHaveProperty('isProfileComplete');
                expect(res.body.isProfileComplete);
                expect(res.body).toHaveProperty('token');
                expect(res.body.token).toHaveProperty('accessToken');
                expect(res.body.token).toHaveProperty('expiresIn');
                expect(res.body.user).toHaveProperty('id');
                expect(res.body.user).toHaveProperty('name');
                expect(res.body.user).toHaveProperty('email');
                expect(res.body.user).toHaveProperty('mobile');
                expect(res.body.user).toHaveProperty('userType');
                expect(res.body.user).toHaveProperty('age');
                expect(res.body.user).toHaveProperty('bio');
                expect(res.body.user).toHaveProperty('isActive');
                expect(res.body.user).toHaveProperty('passwordHash');
            });
        });
    });

    describe('User Routes- Get active plans', () => {
        it('should return active plans for authenticated users', async () => {
            await request(app.getHttpServer())
            .get('/plans/active')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('subscribedPlan');
                expect(res.body).toHaveProperty('availablePlans');
                expect(res.body.availablePlans[0]).toHaveProperty('id');
                expect(res.body.availablePlans[0]).toHaveProperty('planName');
                expect(res.body.availablePlans[0]).toHaveProperty('price');
                expect(res.body.availablePlans[0]).toHaveProperty('validityInDays');
            });
        });
    });

    describe('User Routes- Get payment quote', () => {
        it('should return upgrade quote for authenticated users', async () => {
            await request(app.getHttpServer())
            .get('/plans/quote')
            .set('Authorization', `Bearer ${userToken}`)
            .query({ targetPlanId: createdPlanId})
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('amountDue');
                expect(res.body).toHaveProperty('disclaimer');
                expect(res.body).toHaveProperty('actionType');
                expect(res.body).toHaveProperty('currentPlan');
                expect(res.body).toHaveProperty('targetPlan');
                expect(res.body.targetPlan).toHaveProperty('id');
                expect(res.body.targetPlan).toHaveProperty('name');
                expect(res.body.targetPlan).toHaveProperty('price');
                expect(res.body.targetPlan).toHaveProperty('validityInDays');
                createdPlanPrice = res.body.amountDue;
            });
        });
    });

    describe('User Routes- Initiate payment', () => {
        it('POST /payment/initiate should create order via WebhookService', async () => {
            const pendingSubscription = subscriptionRepository.create({
                userId,
                planId: createdPlanId,
                amount: createdPlanPrice,
                gateway: 'razorpay',
                expiresOn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                paymentStatus: 'pending',
            });
            const savedSubscription = await subscriptionRepository.save(pendingSubscription);
            pendingSubscriptionId = savedSubscription.id;
            expect(pendingSubscriptionId).toBeDefined();
            expect(pendingSubscriptionId).toBeGreaterThan(0);
           
            await request(app.getHttpServer())
            .post('/payment/initiate')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                planId: createdPlanId,
                amount: createdPlanPrice,
                gateway: 'razorpay',
                planName: createdPlanName,
                subscriptionId: pendingSubscriptionId,
            })
            .expect((res) => {
                expect(res.body).toHaveProperty('orderId');
                expect(res.body).toHaveProperty('paymentId');
                expect(typeof res.body.paymentId).toBe('number');
                expect(res.body.orderId).toEqual(expect.any(String));
                paymentId = res.body.paymentId;
            });
        });
    });

    // this route is initiating the payment from the user to subscribe to a plan and will be passed on to payment service.
    // We will be mocking the response from payment service to test the flow. using mock payload.
    describe('User Routes- Process payment', () => {
        it('POST /payment/webhook should process payment updates', async () => {
            await request(app.getHttpServer())
                .post('/payment/webhook')
                .send({
                    subscriptionId: pendingSubscriptionId,
                    paymentId: paymentId, // generated on payment service
                    transactionId: 'txn_987', // randomly generated on payment service
                    paymentStatus: 'success',
                    amount: createdPlanPrice, // sent in payment/initiate route
                    mandateId: 'mandate_123', // randomly generated on payment service
                    paymentMethodToken: 'token_987', // randomly generated on payment service
                    receiptUrl: 'https://example.com/receipt', // mock receipt url
                    metaData: { 
                        amount: createdPlanPrice,
                        gateway: 'razorpay',
                    }, // mock payload
                })
                .expect(201)
            
            // data from webhook is pushed to rabbitmq queue and is consumed by payment-webhook.consumer.ts
            // payment-webhook.consumer.ts is responsible for processing the webhook and updating the subscription status.
            // we will be mocking the response from payment-webhook.consumer.ts to test the flow. using mock payload.
            let dataToBePublished = {
                subscriptionId: pendingSubscriptionId,
                paymentId: paymentId,
                transactionId: 'txn_987',
                paymentStatus: 'success',
                amount: createdPlanPrice,
                mandateId: 'mandate_123',
                paymentMethodToken: 'token_987',
                receiptUrl: 'https://example.com/receipt',
                notes: 'Payment successful',
                metaData: {
                    amount: createdPlanPrice,
                    gateway: 'razorpay',
                },
            }
            
            const planDetails = await planRepository.findOne({ where: { id: createdPlanId } }) as PlanEntity;
            // mock getting message from rabbitmq queue\
            let updatedSubscription = await subscriptionRepository.update(pendingSubscriptionId, {
                isActive: true,
                receiptUrl: dataToBePublished.receiptUrl ?? '',
                paymentId: paymentId,
                transactionId: dataToBePublished.transactionId,
                paymentStatus: dataToBePublished.paymentStatus as PaymentWebhookEvent,
                subscriptionStatus: 'active' as SubscriptionStatus,
                notes: dataToBePublished.notes ?? '',
                expiresOn: new Date(new Date().getTime() + (planDetails?.validityInDays ?? 30) * 24 * 60 * 60 * 1000),
            });
            expect(updatedSubscription).toBeDefined();
            expect(updatedSubscription.affected).toBe(1);

            const activeSubscription = await subscriptionRepository.findOne({ where: { id: pendingSubscriptionId } }) as SubscriptionEntity;
            expect(activeSubscription).toBeDefined();
        });
    });

    describe('User Routes- Get active plans', () => {
        it('should return active plans for authenticated users', async () => {
            await request(app.getHttpServer())
            .get('/users/profile')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('activeSubscription');
                expect(res.body.activeSubscription).toHaveProperty('id');
                expect(res.body.activeSubscription).toHaveProperty('paymentStatus');
                expect(res.body.activeSubscription.plan.id).toBe(createdPlanId);
                expect(res.body.activeSubscription.paymentStatus).toBe('success');
                expect(res.body.activeSubscription.subscriptionStatus).toBe('active');
            });
        });
    });

    describe('Subscription Cancelation', () => {
        it('PATCH /subscriptions/update should cancel user subscription', async () => {
        await request(app.getHttpServer())
            .patch('/subscription/update')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                action: 'cancel',
                reason: 'Test reason',
            })
            .expect(200)
            const updatedSubscription = await subscriptionRepository.findOne({ where: { id: pendingSubscriptionId } }) as SubscriptionEntity;
            expect(updatedSubscription).toBeDefined();
            expect(updatedSubscription.subscriptionStatus).toBe('canceled');
        });
    });


    describe('User Routes- Get profile', () => {
        it('should return active plans for authenticated users', async () => {
            await request(app.getHttpServer())
            .get('/users/profile')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('activeSubscription');
                expect(res.body.activeSubscription.subscriptionStatus).toBe('canceled');
            });
        });
    });

    afterAll(async () => {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy();
        }
        await app.close();
    });
});


