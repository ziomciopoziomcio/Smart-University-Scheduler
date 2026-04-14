import { TextField, InputAdornment } from '@mui/material';
import { Email } from "@mui/icons-material";
import { useIntl } from 'react-intl';

interface Props {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
};

function EmailInput({ value, onChange, disabled = false }: Props) {
    const intl = useIntl();

    return (
        <TextField
            fullWidth
            required
            type="email"
            disabled={disabled}
            label={intl.formatMessage({ id: 'login.username' })}
            placeholder={intl.formatMessage({ id: 'login.usernamePlaceholder' })}
            value={value}
            onChange={(e) => { onChange(e.target.value); }}
            slotProps={{
                input: {
                    sx: { fontSize: (theme) => theme.fontSizes.small },
                    startAdornment: !value ? (
                        <InputAdornment position="start">
                            <Email sx={{ fontSize: (theme) => theme.iconSizes.textFieldDecorator }} />
                        </InputAdornment>
                    ) : null,
                },
                inputLabel: {
                    sx: { fontSize: (theme) => theme.fontSizes.small }
                }
            }}
        />
    );
}

export default EmailInput;