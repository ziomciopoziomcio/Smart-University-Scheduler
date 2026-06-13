 
import {Box, Typography, IconButton, SvgIcon} from '@mui/material';
import {MoreVert} from '@mui/icons-material';

interface TileViewProps<T> {
    items: T[];
    icon?: React.ElementType;
    getIcon?: (item: T) => React.ElementType;
    getTitle: (item: T) => string;
    getSubtitle?: (item: T) => string | undefined;
    onItemClick: (item: T) => void;
    onMenuOpen?: (e: React.MouseEvent<HTMLElement>, item: T) => void;
    onAddClick?: () => void;
    addLabel?: string;
    hideAdd?: boolean;
    hideMenu?: boolean;
    variant?: 'outlined' | 'flat';
    iconSize?: number;
    stretch?: boolean;
}

export default function TileView<T extends { id: number | string }>({
                                                                        items,
                                                                        icon: DefaultIcon,
                                                                        getIcon,
                                                                        getTitle,
                                                                        getSubtitle,
                                                                        onItemClick,
                                                                        onMenuOpen,
                                                                        onAddClick,
                                                                        addLabel,
                                                                        hideAdd,
                                                                        hideMenu,
                                                                        variant = 'outlined',
                                                                        iconSize = 48,
                                                                        stretch = false
                                                                    }: TileViewProps<T>) {
    const isFlat = variant === 'flat';

    return (
        <Box sx={{display: 'flex', gap: 3, flexWrap: 'wrap', width: '100%'}}>
            {items.map((item) => {
                const ItemIcon = getIcon ? getIcon(item) : DefaultIcon;
                return (
                    <Box
                        key={item.id}
                        onClick={() => {
                            onItemClick(item);
                        }}
                        sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            flexGrow: stretch ? 1 : 0,
                            width: stretch ? '30%' : 'calc(33.33% - 16px)',
                            p: isFlat ? 1.5 : 2.5,
                            border: isFlat ? 'none' : 1,
                            borderColor: 'divider',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease, transform 0.2s ease, border-color 0.2s',
                            bgcolor: 'transparent',
                            '&:hover': {
                                borderColor: isFlat ? 'transparent' : 'text.disabled',
                                bgcolor: 'background.highlight',
                                transform: isFlat ? 'none' : 'translateY(-2px)'
                            },
                            '&:hover .tile-icon': {
                                color: 'primary.main',
                                transform: isFlat ? 'translateX(1px)' : 'none',
                            },
                            '&:hover .tile-title': {
                                color: 'text.primary',
                            },
                            '&:hover .tile-subtitle': {
                                color: 'text.primary',
                            }
                        }}
                    >
                        <Box sx={{display: 'flex', alignItems: 'center', gap: isFlat ? 3 : 2}}>
                            {ItemIcon && (
                                <Box
                                    className="tile-icon"
                                    sx={{
                                        color: 'text.secondary',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        minWidth: isFlat ? 56 : 'auto',
                                        transition: 'color 0.2s ease, transform 0.2s ease',
                                    }}
                                >
                                    <SvgIcon component={ItemIcon} inheritViewBox
                                             sx={{fontSize: iconSize, color: 'inherit'}}/>
                                </Box>
                            )}
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'start',
                                gap: isFlat ? 0.4 : 0
                            }}>
                                <Typography className="tile-title" sx={{
                                    fontWeight: isFlat ? 500 : 600,
                                    fontSize: isFlat ? '18px' : '1rem',
                                    color: 'text.primary',
                                    textAlign: 'start',
                                    lineHeight: 1.2,
                                    transition: 'color 0.2s ease'
                                }}>
                                    {getTitle(item)}
                                </Typography>
                                {getSubtitle && (
                                    <Typography className="tile-subtitle" variant="body2" sx={{
                                        fontSize: isFlat ? '15px' : '0.875rem',
                                        color: 'text.secondary',
                                        textAlign: 'start',
                                        lineHeight: 1.35,
                                        transition: 'color 0.2s ease'
                                    }}>
                                        {getSubtitle(item)}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        {!hideMenu && onMenuOpen && (
                            <IconButton size="small" onClick={(e) => {
                                e.stopPropagation();
                                onMenuOpen(e, item);
                            }}>
                                <MoreVert sx={{color: 'text.disabled'}}/>
                            </IconButton>
                        )}
                    </Box>
                );
            })}

            {!hideAdd && onAddClick && DefaultIcon && (
                <Box onClick={onAddClick} sx={{
                    display: 'flex', alignItems: 'center',
                    flexGrow: stretch ? 1 : 0,
                    width: stretch ? '30%' : 'calc(33.33% - 16px)',
                    p: 2.5,
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: '16px',
                    cursor: 'pointer', transition: 'all 0.2s', gap: 2,
                    '&:hover': {bgcolor: 'background.highlight', borderColor: 'text.disabled'}
                }}>
                    <DefaultIcon inheritViewBox sx={{ color: 'text.disabled', opacity: 0.8 }}/>
                    <Typography color="text.secondary" fontWeight={500}
                                sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <span style={{fontSize: '1.2rem', color: 'inherit'}}>+</span> {addLabel}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}