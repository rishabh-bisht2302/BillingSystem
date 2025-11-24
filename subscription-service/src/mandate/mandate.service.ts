import { Injectable } from '@nestjs/common';
import { UserMandateEntity } from './mandate.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IMandatePayload } from './interfaces/mandate.interface';

@Injectable()
export class MandateService {
    constructor(
        @InjectRepository(UserMandateEntity)
        private readonly mandateRepository: Repository<UserMandateEntity>,
    ) {}

    async createMandate(payload: IMandatePayload): Promise<UserMandateEntity> {
        const mandate = this.mandateRepository.create({ userId: payload.userId, mandateId: payload.mandateId, paymentMethodToken: payload.paymentMethodToken });
        await this.mandateRepository.save(mandate);
        return mandate;
    }

    async findLatestByUserId(userId: number): Promise<UserMandateEntity | null> {
        return this.mandateRepository.findOne({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async revokeMandate(userId: number): Promise<void> {
        await this.mandateRepository.delete({ userId });
    }
}