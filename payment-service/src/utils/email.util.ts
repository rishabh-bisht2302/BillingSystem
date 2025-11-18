export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export function sendEmail({ to, subject, body }: EmailPayload): void {
  // mock utility – simply log for now
  // eslint-disable-next-line no-console
  console.log(
    `[email] to=${to} subject=${subject} body=${body.replace(/\s+/g, ' ').trim()}`,
  );
}

