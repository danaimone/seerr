import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import NotificationTypeSelector from '@app/components/NotificationTypeSelector';
import { useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { ArrowDownOnSquareIcon } from '@heroicons/react/24/outline';
import type { UserSettingsNotificationsResponse } from '@server/interfaces/api/userSettingsInterfaces';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import * as Yup from 'yup';

const messages = defineMessages(
  'components.UserProfile.UserSettings.UserNotificationSettings',
  {
    blueBubblesSettingsSaved:
      'BlueBubbles notification settings saved successfully!',
    blueBubblesSettingsFailed:
      'BlueBubbles notification settings failed to save.',
    blueBubblesPhoneNumber: 'Phone Number or iMessage Email',
    blueBubblesPhoneNumberTip:
      'Enter a phone number (+15551234567) or iMessage email address',
    validationPhoneNumber:
      'You must provide a valid phone number (+15551234567) or email address',
  }
);

const UserBlueBubblesSettings = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const router = useRouter();
  const { user } = useUser({ id: Number(router.query.userId) });
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<UserSettingsNotificationsResponse>(
    user ? `/api/v1/user/${user?.id}/settings/notifications` : null
  );

  const UserNotificationsBlueBubblesSchema = Yup.object().shape({
    blueBubblesPhoneNumber: Yup.string()
      .when('types', {
        is: (types: number) => !!types,
        then: Yup.string()
          .nullable()
          .required(intl.formatMessage(messages.validationPhoneNumber)),
        otherwise: Yup.string().nullable(),
      })
      .matches(
        /^(\+\d{10,15}|[^@\s]+@[^@\s]+\.[^@\s]+)$/,
        intl.formatMessage(messages.validationPhoneNumber)
      ),
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <Formik
      initialValues={{
        blueBubblesPhoneNumber: data?.blueBubblesPhoneNumber,
        types: data?.notificationTypes.bluebubbles ?? 0,
      }}
      validationSchema={UserNotificationsBlueBubblesSchema}
      enableReinitialize
      onSubmit={async (values) => {
        try {
          await axios.post(`/api/v1/user/${user?.id}/settings/notifications`, {
            pgpKey: data?.pgpKey,
            discordId: data?.discordId,
            pushbulletAccessToken: data?.pushbulletAccessToken,
            pushoverApplicationToken: data?.pushoverApplicationToken,
            pushoverUserKey: data?.pushoverUserKey,
            telegramChatId: data?.telegramChatId,
            telegramMessageThreadId: data?.telegramMessageThreadId,
            telegramSendSilently: data?.telegramSendSilently,
            blueBubblesPhoneNumber: values.blueBubblesPhoneNumber,
            notificationTypes: {
              bluebubbles: values.types,
            },
          });
          addToast(intl.formatMessage(messages.blueBubblesSettingsSaved), {
            appearance: 'success',
            autoDismiss: true,
          });
        } catch (e) {
          addToast(intl.formatMessage(messages.blueBubblesSettingsFailed), {
            appearance: 'error',
            autoDismiss: true,
          });
        } finally {
          revalidate();
        }
      }}
    >
      {({
        errors,
        touched,
        isSubmitting,
        isValid,
        values,
        setFieldValue,
        setFieldTouched,
      }) => {
        return (
          <Form className="section">
            <div className="form-row">
              <label htmlFor="blueBubblesPhoneNumber" className="text-label">
                {intl.formatMessage(messages.blueBubblesPhoneNumber)}
                <span className="label-required">*</span>
                <span className="label-tip">
                  {intl.formatMessage(messages.blueBubblesPhoneNumberTip)}
                </span>
              </label>
              <div className="form-input-area">
                <div className="form-input-field">
                  <Field
                    id="blueBubblesPhoneNumber"
                    name="blueBubblesPhoneNumber"
                    type="text"
                    placeholder="+15551234567 or user@icloud.com"
                  />
                </div>
                {errors.blueBubblesPhoneNumber &&
                  touched.blueBubblesPhoneNumber &&
                  typeof errors.blueBubblesPhoneNumber === 'string' && (
                    <div className="error">{errors.blueBubblesPhoneNumber}</div>
                  )}
              </div>
            </div>
            <NotificationTypeSelector
              user={user}
              currentTypes={values.types}
              onUpdate={(newTypes) => {
                setFieldValue('types', newTypes);
                setFieldTouched('types');
              }}
              error={
                errors.types && touched.types
                  ? (errors.types as string)
                  : undefined
              }
            />
            <div className="actions">
              <div className="flex justify-end">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    type="submit"
                    disabled={isSubmitting || !isValid}
                  >
                    <ArrowDownOnSquareIcon />
                    <span>
                      {isSubmitting
                        ? intl.formatMessage(globalMessages.saving)
                        : intl.formatMessage(globalMessages.save)}
                    </span>
                  </Button>
                </span>
              </div>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default UserBlueBubblesSettings;
