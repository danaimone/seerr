import UserSettings from '@app/components/UserProfile/UserSettings';
import UserNotificationSettings from '@app/components/UserProfile/UserSettings/UserNotificationSettings';
import UserNotificationsBlueBubbles from '@app/components/UserProfile/UserSettings/UserNotificationSettings/UserNotificationsBlueBubbles';
import type { NextPage } from 'next';

const NotificationsPage: NextPage = () => {
  return (
    <UserSettings>
      <UserNotificationSettings>
        <UserNotificationsBlueBubbles />
      </UserNotificationSettings>
    </UserSettings>
  );
};

export default NotificationsPage;
