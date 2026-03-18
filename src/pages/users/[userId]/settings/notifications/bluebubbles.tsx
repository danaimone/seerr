import UserSettings from '@app/components/UserProfile/UserSettings';
import UserNotificationSettings from '@app/components/UserProfile/UserSettings/UserNotificationSettings';
import UserNotificationsBlueBubbles from '@app/components/UserProfile/UserSettings/UserNotificationSettings/UserNotificationsBlueBubbles';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@app/hooks/useUser';
import type { NextPage } from 'next';

const NotificationsPage: NextPage = () => {
  useRouteGuard(Permission.MANAGE_USERS);
  return (
    <UserSettings>
      <UserNotificationSettings>
        <UserNotificationsBlueBubbles />
      </UserNotificationSettings>
    </UserSettings>
  );
};

export default NotificationsPage;
