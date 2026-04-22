import {Avatar, type SxProps, type Theme} from '@mui/material';

interface UserAvatarProps {
    name?: string;
    surname?: string;
    size?: number;
    sx?: SxProps<Theme>;
}

const AVATAR_COLORS = [
    {bg: '#FF8A65', text: '#87503f'},
    {bg: '#4DB6AC', text: '#357871FF'},
    {bg: '#7986CB', text: '#515C95FF'},
    {bg: '#9575CD', text: '#594288FF'},
    {bg: '#90A4AE', text: '#546167FF'},
    {bg: '#AED581', text: '#3D5A1A'},
    {bg: '#F06292', text: '#853252FF'},
    {bg: '#4FC3F7', text: '#256078FF'},
    {bg: '#FFD54F', text: '#5D4037'},
];

export default function UserAvatar({name, surname, size = 32, sx}: UserAvatarProps) {
    const safeName = name?.trim() || '';
    const safeSurname = surname?.trim() || '';

    const getStyleIndex = () => {
        const fullString = `${safeName}${safeSurname}`;
        if (!fullString) return 0;

        let sum = 0;
        for (let i = 0; i < fullString.length; i++) {
            sum += fullString.charCodeAt(i);
        }
        return sum % AVATAR_COLORS.length;
    };

    const style = AVATAR_COLORS[getStyleIndex()];
    const initials = `${safeName[0] || ''}${safeSurname[0] || ''}`.toUpperCase();

    const fontSize = Math.max(10, size * 0.4);

    return (
        <Avatar
            sx={{
                width: size,
                height: size,
                fontSize: `${fontSize}px`,
                fontWeight: 400,
                bgcolor: style.bg,
                color: style.text,
                ...sx
            }}
        >
            {initials || '?'}
        </Avatar>
    );
}