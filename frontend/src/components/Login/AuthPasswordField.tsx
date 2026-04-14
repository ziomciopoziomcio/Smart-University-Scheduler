import {IconButton, InputAdornment, TextField} from '@mui/material';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';

type Props = {
    label: string;
    placeholder: string;
    showPassword: boolean;
    onTogglePassword: () => void;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
};

function AuthPasswordField({
                               label,
                               placeholder,
                               showPassword,
                               onTogglePassword,
                               value,
                               onChange,
                               disabled,
                           }: Props) {

    return (
        <TextField
            label={label}
            type={showPassword ? 'text' : 'password'}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            fullWidth
            required

            slotProps={{
        input: {
            sx: { fontSize: (theme) => theme.fontSizes.small },
            startAdornment: !value ? (
                <InputAdornment position="start">
                    <Lock sx={{ fontSize: (theme) => theme.iconSizes.textFieldDecorator }}/>
                </InputAdornment>
            ) : null,
            endAdornment: (
                <InputAdornment position="end">
                    <IconButton onClick={onTogglePassword} edge="end" disabled={disabled} >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                </InputAdornment>
            ),
        },
        inputLabel: {
            sx: { fontSize: (theme) => theme.fontSizes.small }
        }
    }}
        />
    );
}

export default AuthPasswordField;