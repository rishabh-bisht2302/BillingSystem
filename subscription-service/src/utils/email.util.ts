import {
    config
} from '../config/constants';
export const sendEmailToUser = (email: string | undefined, action: string): void => {
    if (!email) {
        console.warn('Email is required to send email to user');
        return;
    }
    // log the string for represent mailing functionality
    if (action === config.paymentStatus.FAILED) {
        console.log(`[email] to=${email} subject=Subscription Failure body=Dear Customer, your payment has failed due to technical issues.Any amount charged will be refunded to your account within 7 days.Thank you for your understanding.`);
    } else if (action === config.paymentStatus.SUCCESS) {
        console.log(`[email] to=${email} subject=Subscription Success body=Dear Customer, your payment has been successful.Thank you for your subscription.`);
    } else if (action === config.paymentStatus.REFUND_SUCCESS) {
        console.log(`[email] to=${email} subject=Subscription Refund Success body=Dear Customer, your payment has been refunded successfully. Please initiate a new subscription to continue your service.`);
    } else if (action === config.paymentStatus.REFUND_FAILED) {
        console.log(`[email] to=${email} subject=Subscription Refund Failed body=Dear Customer, refund of your deducted amount has failed. Please contact our support team for assistance. We apologize for the inconvenience caused.`);
    } else if (action === config.subscriptionAction.CANCEL) {
        console.log(`[email] to=${email} subject=Subscription Cancelled body=Dear Customer, your subscription has been cancelled. You can enjoy our services till the validity of your current subscription period.`);
    } else if (action === config.subscriptionAction.UPDATE_PLAN) {
        console.log(`[email] to=${email} subject=Subscription Upgraded body=Dear Customer, your subscription has been upgraded. Thank you for your subscription.`);
    } else if (action === config.subscriptionAction.DOWNGRADE_PLAN) {
        console.log(`[email] to=${email} subject=Subscription Downgraded body=Dear Customer, your subscription has been downgraded. The new subscription will be active from the next billing cycle.`);
    }
};