import {
    IconButton,
    InputAdornment,
    TextField,
} from '@mui/material';

type Props = {
    label: string;
    placeholder: string;
    showPassword: boolean;
    onTogglePassword: () => void;
};

function AuthPasswordField({
                               label,
                               placeholder,
                               showPassword,
                               onTogglePassword,
                           }: Props) {
    return (
        <TextField
            label={label}
            type={showPassword ? 'text' : 'password'}
            placeholder={placeholder}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <IconButton onClick={onTogglePassword} edge="end">
                            👁️‍🗨️
                        </IconButton>
                    </InputAdornment>
                ),
            }}
        />
    );
}

export default AuthPasswordField;