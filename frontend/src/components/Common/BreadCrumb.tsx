import {Breadcrumbs, Typography, Box, Link as MuiLink, type Theme, type SxProps} from '@mui/material';
import {NavigateNext} from '@mui/icons-material';
import {Link as RouterLink} from 'react-router-dom';
import {useTheme} from '@mui/material/styles';

export interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface PageBreadcrumbsProps {
    items: BreadcrumbItem[];
    sx?: SxProps<Theme>;
}

export function PageBreadcrumbs({items, sx}: PageBreadcrumbsProps) {

    const theme = useTheme();

    return (
        <Box sx={{
            p: 2,
            borderRadius: '16px',
            border: 1,
            borderColor: 'divider',
            background: theme.palette.background.paper,
            display: 'flex',
            alignItems: 'center',
            boxShadow: theme.palette.mode === 'dark' 
                ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
                : '0 2px 12px rgba(0, 0, 0, 0.06)',
            ...sx
        }}>
            <Breadcrumbs
                separator={<NavigateNext fontSize="small"/>}
                aria-label="breadcrumb"
            >
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return isLast || !item.path ? (
                        <Typography key={index} color="text.primary" fontWeight={600} fontSize="0.9rem">
                            {item.label}
                        </Typography>
                    ) : (
                        <MuiLink
                            key={index}
                            component={RouterLink}
                            to={item.path}
                            sx={{
                                textDecoration: 'none',
                                color: 'text.secondary',
                                fontSize: '0.9rem',
                                '&:hover': {
                                    textDecoration: 'underline',
                                    color: 'primary.main'
                                }
                            }}
                        >
                            {item.label}
                        </MuiLink>
                    );
                })}
            </Breadcrumbs>
        </Box>
    );
}