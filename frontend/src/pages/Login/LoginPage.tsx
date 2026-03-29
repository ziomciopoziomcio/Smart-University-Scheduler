import {useState} from 'react';
import {Button, Stack} from '@mui/material';
import {FormattedMessage, useIntl} from 'react-intl';
import AuthLayout from '@components/Login/AuthLayout';
import AuthPasswordField from '@components/Login/AuthPasswordField';
import TextField from '@mui/material/TextField';

function LoginPage() {
    const intl = useIntl();
    const [showPassword, setShowPassword] = useState(false);

    return (
        <AuthLayout title={<FormattedMessage id="login.title"/>}>
            <Stack
                component="form"
                spacing={2.5}
                width="100%"
                onSubmit={(e) => e.preventDefault()}
            >
                <TextField
                    label={intl.formatMessage({id: 'login.username'})}
                    placeholder={intl.formatMessage({id: 'login.usernamePlaceholder'})}
                />

                <AuthPasswordField
                    label={intl.formatMessage({id: 'login.password'})}
                    placeholder={intl.formatMessage({id: 'login.passwordPlaceholder'})}
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword((prev) => !prev)}
                />

                <Button type="submit" variant="contained">
                    {intl.formatMessage({id: 'login.submit'})}
                </Button>

                <Stack direction="row" justifyContent="space-between">
                    <Button variant="text">
                        <FormattedMessage id="login.createAccount"/>
                    </Button>
                    <Button variant="text">
                        <FormattedMessage id="login.forgotPassword"/>
                    </Button>
                </Stack>
            </Stack>
        </AuthLayout>
    );
}

export default LoginPage;