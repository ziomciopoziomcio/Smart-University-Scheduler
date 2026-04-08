import {IconButton, InputAdornment, TextField} from '@mui/material';

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
        />
    );
}

export default AuthPasswordField;