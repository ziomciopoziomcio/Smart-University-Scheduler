import { Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

type Props = {
    disabled?: boolean;
    onClick?: () => void;
};

function BackToLoginButton({ disabled = false, onClick }: Props) {
    const navigate = useNavigate();
    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate('/login');
        }
    };
    return (
        <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleClick}
            disabled={disabled}
            sx={{ textTransform: 'none', color: '#004d71' }}
        >
            <FormattedMessage id="register.backToLogin" />
        </Button>
    );
}

export default BackToLoginButton;