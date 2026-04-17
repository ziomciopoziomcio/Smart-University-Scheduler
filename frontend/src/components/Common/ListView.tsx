import {Box, Typography, Divider, Button, IconButton, SvgIcon} from '@mui/material';
import {Add, MoreVert} from '@mui/icons-material';

export interface ListColumn<T> {
    render: (item: T) => React.ReactNode | string;
    variant?: 'primary' | 'secondary';
    width?: string | number;
    icon?: React.ElementType;
}

interface ListViewProps<T> {
    items: T[];
    icon: React.ElementType;
    getTitle: (item: T) => string | React.ReactNode;
    titleWidth?: string | number;
    columns?: ListColumn<T>[];
    onItemClick?: (item: T) => void;
    onMenuOpen?: (e: React.MouseEvent<HTMLElement>, item: T) => void;
    onAddClick: () => void;
    addLabel: string;
    emptyMessage: string;
}

export default function ListView<T extends { id: number | string }>({
                                                                        items,
                                                                        icon: Icon,
                                                                        getTitle,
                                                                        titleWidth,
                                                                        columns = [],
                                                                        onItemClick,
                                                                        onMenuOpen,
                                                                        onAddClick,
                                                                        addLabel,
                                                                        emptyMessage
                                                                    }: ListViewProps<T>) {
    return (
        <Box>
            {items.length === 0 && (
                <Typography color="text.secondary" textAlign="center" py={4}>
                    {emptyMessage}
                </Typography>
            )}

            {items.map((item) => (
                <Box key={item.id}>
                    <Box
                        onClick={() => onItemClick && onItemClick(item)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            py: 2,
                            cursor: onItemClick ? 'pointer' : 'default',
                            '&:hover': {bgcolor: '#fbfbfb'}
                        }}
                    >
                        <Box sx={{mr: 2, display: 'flex', alignItems: 'center'}}>
                            <SvgIcon component={Icon} inheritViewBox
                                     sx={{fontSize: 28, color: 'text.secondary', opacity: 0.6}}/>
                        </Box>

                        <Box sx={{display: 'flex', alignItems: 'center', gap: 3}}>
                            <Typography fontWeight={600} sx={{width: titleWidth}}>
                                {getTitle(item)}
                            </Typography>

                            {columns.map((col, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        width: col.width || 'auto',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}
                                >
                                    {col.icon && (
                                        <SvgIcon
                                            component={col.icon}
                                            inheritViewBox
                                            sx={{
                                                fontSize: 18,
                                                color: col.variant === 'primary' ? 'text.primary' : 'text.secondary',
                                                opacity: 0.7
                                            }}
                                        />
                                    )}
                                    <Typography
                                        variant="body2"
                                        color={col.variant === 'primary' ? 'text.primary' : 'text.secondary'}
                                        // fontWeight={col.variant === 'primary' ? 600 : 400}
                                        // TODO: add tooltip with full text if truncated
                                        // TODO: Think about font weight for primary vs secondary columns
                                        sx={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {col.render(item)}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        {onMenuOpen && (
                            <IconButton size="small" onClick={(e) => {
                                onMenuOpen(e, item);
                            }} sx={{ml: 'auto'}}>
                                <MoreVert sx={{color: '#aaa'}}/>
                            </IconButton>
                        )}
                    </Box>
                    <Divider/>
                </Box>
            ))}

            <Button startIcon={<Add/>} onClick={onAddClick}
                    sx={{mt: 2, color: 'text.secondary', textTransform: 'none', fontWeight: 500}}>
                {addLabel}
            </Button>
        </Box>
    );
}