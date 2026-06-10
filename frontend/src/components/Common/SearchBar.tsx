import {Paper, InputBase} from '@mui/material';
import {Search} from '@mui/icons-material';
import {useTheme} from '@mui/material/styles';


interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function SearchBar({value, onChange, placeholder = 'Szukaj...'}: SearchBarProps) {

    const theme = useTheme();

    return (
        <Paper
            elevation={0}
            sx={{
                p: '2px 16px',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: 53,
                borderRadius: '16px',
                background: theme.palette.background.paper
            }}
        >
            <Search sx={{color: 'text.secondary', mr: 1}}/>
            <InputBase
                sx={{ml: 1, flex: 1, fontSize: theme.fontSizes.medium}}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </Paper>
    );
}