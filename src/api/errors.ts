export class NotificationsOffError extends Error {
  constructor() {
    super('Message notifications are turned off for this instance, so the app cannot receive replies or read receipts.');
    this.name = 'NotificationsOffError';
  }
}
