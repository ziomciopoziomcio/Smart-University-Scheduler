import { Breadcrumbs, Typography, Box } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface PageBreadcrumbsProps {
    items: BreadcrumbItem[];
}

export default function PageBreadcrumbs({ items }: PageBreadcrumbsProps) {
    return (
        <Box sx={{
            p: 2,
            borderRadius: '16px',
            border: '1px solid rgba(0,0,0,0.05)',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
        }}>
            <Breadcrumbs
                separator={<NavigateNext fontSize="small" />}
                aria-label="breadcrumb"
            >
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return isLast || !item.path ? (
                        <Typography key={index} color="text.primary" fontWeight={600} fontSize="0.9rem">
                            {item.label}
                        </Typography>
                    ) : (
                        <Link
                            key={index}
                            to={item.path}
                            style={{ textDecoration: 'none', color: '#555' }}
                        >
                            <Typography sx={{ fontSize: '0.9rem', '&:hover': { textDecoration: 'underline' } }}>
                                {item.label}
                            </Typography>
                        </Link>
                    );
                })}
            </Breadcrumbs>
        </Box>
    );
}