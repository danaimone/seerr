import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import NotificationTypeSelector from '@app/components/NotificationTypeSelector';
import useToasts from '@app/hooks/useToasts';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { ArrowDownOnSquareIcon, BeakerIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';
import * as Yup from 'yup';

const messages = defineMessages('components.Settings.Notifications', {
  agentenabled: 'Enable Agent',
  blueBubblesServerUrl: 'BlueBubbles Server URL',
  blueBubblesServerUrlTip:
    'The URL of your BlueBubbles server (e.g., http://192.168.1.100:1234)',
  blueBubblesPassword: 'BlueBubbles Password',
  blueBubblesPasswordTip: 'The password configured in your BlueBubbles server',
  validationServerUrlRequired: 'You must provide a BlueBubbles server URL',
  validationPasswordRequired: 'You must provide a BlueBubbles password',
  blueBubblesSettingsSaved:
    'BlueBubbles notification settings saved successfully!',
  blueBubblesSettingsFailed:
    'BlueBubbles notification settings failed to save.',
  toastBlueBubblesTestSending: 'Sending BlueBubbles test notification\u2026',
  toastBlueBubblesTestSuccess: 'BlueBubbles test notification sent!',
  toastBlueBubblesTestFailed: 'BlueBubbles test notification failed to send.',
});

const NotificationsBlueBubbles = () => {
  const intl = useIntl();
  const { addToast, removeToast } = useToasts();
  const [isTesting, setIsTesting] = useState(false);
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR('/api/v1/settings/notifications/bluebubbles');

  const NotificationsBlueBubblesSchema = Yup.object().shape({
    serverUrl: Yup.string().when('enabled', {
      is: true,
      then: (schema) =>
        schema
          .nullable()
          .required(intl.formatMessage(messages.validationServerUrlRequired)),
      otherwise: (schema) => schema.nullable(),
    }),
    password: Yup.string().when('enabled', {
      is: true,
      then: (schema) =>
        schema
          .nullable()
          .required(intl.formatMessage(messages.validationPasswordRequired)),
      otherwise: (schema) => schema.nullable(),
    }),
  });

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  return (
    <Formik
      initialValues={{
        enabled: data?.enabled,
        types: data?.types,
        serverUrl: data?.options.serverUrl,
        password: data?.options.password,
      }}
      validationSchema={NotificationsBlueBubblesSchema}
      onSubmit={async (values) => {
        try {
          await axios.post('/api/v1/settings/notifications/bluebubbles', {
            enabled: values.enabled,
            types: values.types,
            options: {
              serverUrl: values.serverUrl,
              password: values.password,
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
        values,
        isValid,
        setFieldValue,
        setFieldTouched,
      }) => {
        const testSettings = async () => {
          setIsTesting(true);
          let toastId: string | undefined;
          try {
            addToast(
              intl.formatMessage(messages.toastBlueBubblesTestSending),
              {
                autoDismiss: false,
                appearance: 'info',
              },
              (id) => {
                toastId = id;
              }
            );
            await axios.post(
              '/api/v1/settings/notifications/bluebubbles/test',
              {
                enabled: true,
                types: values.types,
                options: {
                  serverUrl: values.serverUrl,
                  password: values.password,
                },
              }
            );

            if (toastId) {
              removeToast(toastId);
            }
            addToast(intl.formatMessage(messages.toastBlueBubblesTestSuccess), {
              autoDismiss: true,
              appearance: 'success',
            });
          } catch (e) {
            if (toastId) {
              removeToast(toastId);
            }
            addToast(intl.formatMessage(messages.toastBlueBubblesTestFailed), {
              autoDismiss: true,
              appearance: 'error',
            });
          } finally {
            setIsTesting(false);
          }
        };

        return (
          <Form className="section">
            <div className="form-row">
              <label htmlFor="enabled" className="checkbox-label">
                {intl.formatMessage(messages.agentenabled)}
                <span className="label-required">*</span>
              </label>
              <div className="form-input-area">
                <Field type="checkbox" id="enabled" name="enabled" />
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="serverUrl" className="text-label">
                {intl.formatMessage(messages.blueBubblesServerUrl)}
                <span className="label-required">*</span>
                <span className="label-tip">
                  {intl.formatMessage(messages.blueBubblesServerUrlTip)}
                </span>
              </label>
              <div className="form-input-area">
                <div className="form-input-field">
                  <Field
                    id="serverUrl"
                    name="serverUrl"
                    type="text"
                    placeholder="http://192.168.1.100:1234"
                  />
                </div>
                {errors.serverUrl &&
                  touched.serverUrl &&
                  typeof errors.serverUrl === 'string' && (
                    <div className="error">{errors.serverUrl}</div>
                  )}
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="password" className="text-label">
                {intl.formatMessage(messages.blueBubblesPassword)}
                <span className="label-required">*</span>
                <span className="label-tip">
                  {intl.formatMessage(messages.blueBubblesPasswordTip)}
                </span>
              </label>
              <div className="form-input-area">
                <div className="form-input-field">
                  <SensitiveInput
                    as="field"
                    id="password"
                    name="password"
                    type="text"
                  />
                </div>
                {errors.password &&
                  touched.password &&
                  typeof errors.password === 'string' && (
                    <div className="error">{errors.password}</div>
                  )}
              </div>
            </div>
            <NotificationTypeSelector
              currentTypes={values.enabled ? values.types : 0}
              onUpdate={(newTypes) => {
                setFieldValue('types', newTypes);
                setFieldTouched('types');

                if (newTypes) {
                  setFieldValue('enabled', true);
                }
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
                    buttonType="warning"
                    disabled={isSubmitting || !isValid || isTesting}
                    onClick={(e) => {
                      e.preventDefault();
                      testSettings();
                    }}
                  >
                    <BeakerIcon />
                    <span>
                      {isTesting
                        ? intl.formatMessage(globalMessages.testing)
                        : intl.formatMessage(globalMessages.test)}
                    </span>
                  </Button>
                </span>
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    type="submit"
                    disabled={isSubmitting || !isValid || isTesting}
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

export default NotificationsBlueBubbles;
