export enum NotificationChannel {
  Email = 'Email',
  Slack = 'Slack',
  PagerDuty = 'PagerDuty',
  Webhook = 'Webhook',
  InApp = 'InApp',
}

export interface INotification {
  channel: NotificationChannel;
  recipients: string[]; // emails, usernames, webhook URLs
  templateRef?: string;
}
