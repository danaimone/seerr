import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import type { NotificationAgentBlueBubbles } from '@server/lib/settings';
import { NotificationAgentKey, getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { Notification, shouldSendAdminNotification } from '..';
import type { NotificationAgent, NotificationPayload } from './agent';
import { BaseAgent } from './agent';

class BlueBubblesAgent
  extends BaseAgent<NotificationAgentBlueBubbles>
  implements NotificationAgent
{
  protected getSettings(): NotificationAgentBlueBubbles {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.bluebubbles;
  }

  public shouldSend(): boolean {
    const settings = this.getSettings();

    if (
      settings.enabled &&
      settings.options.serverUrl &&
      settings.options.password
    ) {
      return true;
    }

    return false;
  }

  private buildMessage(
    type: Notification,
    payload: NotificationPayload
  ): string {
    const settings = getSettings();
    const applicationTitle = settings.main.applicationTitle;

    switch (type) {
      case Notification.TEST_NOTIFICATION:
        return `This is a test notification from ${applicationTitle}.`;
      case Notification.MEDIA_PENDING:
        return `"${payload.subject}" has been requested and is awaiting approval.`;
      case Notification.MEDIA_APPROVED:
      case Notification.MEDIA_AUTO_APPROVED:
      case Notification.MEDIA_AUTO_REQUESTED:
        return `Your request for "${payload.subject}" has been approved and is now being processed.`;
      case Notification.MEDIA_AVAILABLE:
        return `"${payload.subject}" is now available on ${applicationTitle}!`;
      case Notification.MEDIA_DECLINED:
        return `Your request for "${payload.subject}" has been declined.`;
      case Notification.MEDIA_FAILED:
        return `There was an issue processing "${payload.subject}".`;
      case Notification.ISSUE_CREATED:
      case Notification.ISSUE_COMMENT:
      case Notification.ISSUE_RESOLVED:
      case Notification.ISSUE_REOPENED:
        return `"${payload.subject}"${payload.message ? ' \u2014 ' + payload.message : ''}`;
      default:
        return `${payload.subject}${payload.message ? ' \u2014 ' + payload.message : ''}`;
    }
  }

  private async sendMessage(address: string, text: string): Promise<void> {
    const settings = this.getSettings();
    const { serverUrl, password } = settings.options;

    await axios.post(
      `${serverUrl}/api/v1/message/text?password=${encodeURIComponent(password)}`,
      {
        chatGuid: `iMessage;-;${address}`,
        tempGuid: `temp-${randomUUID()}`,
        message: text,
      }
    );
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    const message = this.buildMessage(type, payload);

    // System notifications: skip (no system-level phone number for BlueBubbles)
    if (payload.notifySystem) {
      // For test notifications sent from admin settings, we log but skip
      // since there is no global phone number to send to
      if (type === Notification.TEST_NOTIFICATION) {
        // Test notifications from admin config page use notifySystem
        // We need a phone number to actually test, so we check if the admin user has one
        if (payload.notifyUser?.settings?.blueBubblesPhoneNumber) {
          logger.debug('Sending BlueBubbles test notification', {
            label: 'Notifications',
            recipient: payload.notifyUser.displayName,
          });

          try {
            await this.sendMessage(
              payload.notifyUser.settings.blueBubblesPhoneNumber,
              message
            );
          } catch (e) {
            logger.error('Error sending BlueBubbles test notification', {
              label: 'Notifications',
              errorMessage: e.message,
              response: e?.response?.data,
            });
            return false;
          }
        } else {
          logger.warn(
            'BlueBubbles test notification skipped: no phone number configured for user',
            { label: 'Notifications' }
          );
          return false;
        }
      }
    }

    // User notification
    if (payload.notifyUser) {
      if (
        payload.notifyUser.settings?.hasNotificationType(
          NotificationAgentKey.BLUEBUBBLES,
          type
        ) &&
        payload.notifyUser.settings?.blueBubblesPhoneNumber
      ) {
        logger.debug('Sending BlueBubbles notification', {
          label: 'Notifications',
          recipient: payload.notifyUser.displayName,
          type: Notification[type],
          subject: payload.subject,
        });

        try {
          await this.sendMessage(
            payload.notifyUser.settings.blueBubblesPhoneNumber,
            message
          );
        } catch (e) {
          logger.error('Error sending BlueBubbles notification', {
            label: 'Notifications',
            recipient: payload.notifyUser.displayName,
            type: Notification[type],
            subject: payload.subject,
            errorMessage: e.message,
            response: e?.response?.data,
          });

          return false;
        }
      }
    }

    // Admin notifications
    if (payload.notifyAdmin) {
      const userRepository = getRepository(User);
      const users = await userRepository.find();

      await Promise.all(
        users
          .filter(
            (user) =>
              user.settings?.hasNotificationType(
                NotificationAgentKey.BLUEBUBBLES,
                type
              ) && shouldSendAdminNotification(type, user, payload)
          )
          .map(async (user) => {
            if (user.settings?.blueBubblesPhoneNumber) {
              logger.debug('Sending BlueBubbles notification', {
                label: 'Notifications',
                recipient: user.displayName,
                type: Notification[type],
                subject: payload.subject,
              });

              try {
                await this.sendMessage(
                  user.settings.blueBubblesPhoneNumber,
                  message
                );
              } catch (e) {
                logger.error('Error sending BlueBubbles notification', {
                  label: 'Notifications',
                  recipient: user.displayName,
                  type: Notification[type],
                  subject: payload.subject,
                  errorMessage: e.message,
                  response: e?.response?.data,
                });

                return false;
              }
            }
          })
      );
    }

    return true;
  }
}

export default BlueBubblesAgent;
