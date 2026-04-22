/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
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
                                                                        iconSize = 48
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
                            flexGrow: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            minWidth: 320,
                            p: isFlat ? 1.5 : 2.5,
                            border: isFlat ? 'none' : '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease, transform 0.2s ease, border-color 0.2s',
                            bgcolor: 'transparent',
                            '&:hover': {
                                borderColor: isFlat ? 'transparent' : 'rgba(0,0,0,0.2)',
                                bgcolor: isFlat ? '#F3F5F8' : '#fbfbfb',
                                transform: isFlat ? 'none' : 'translateY(-2px)'
                            },
                            // Efekty hover dla wariantu flat
                            '&:hover .tile-icon': {
                                color: isFlat ? '#686868' : 'inherit',
                                transform: isFlat ? 'translateX(1px)' : 'none',
                            },
                            '&:hover .tile-title': {
                                color: isFlat ? '#505050' : 'text.primary',
                            },
                            '&:hover .tile-subtitle': {
                                color: isFlat ? '#666666' : 'text.primary',
                            }
                        }}
                    >
                        <Box sx={{display: 'flex', alignItems: 'center', gap: isFlat ? 3 : 2}}>
                            {ItemIcon && (
                                <Box
                                    className="tile-icon"
                                    sx={{
                                        color: isFlat ? '#7b7b7b' : 'rgba(0,0,0,0.4)',
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
                                    color: isFlat ? '#6b6b6b' : 'text.primary',
                                    textAlign: 'start',
                                    lineHeight: 1.2,
                                    transition: 'color 0.2s ease'
                                }}>
                                    {getTitle(item)}
                                </Typography>
                                {getSubtitle && (
                                    <Typography className="tile-subtitle" variant="body2" sx={{
                                        fontSize: isFlat ? '15px' : '0.875rem',
                                        color: isFlat ? '#7a7a7a' : 'text.secondary',
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
                                <MoreVert/>
                            </IconButton>
                        )}
                    </Box>
                );
            })}

            {!hideAdd && onAddClick && DefaultIcon && (
                <Box onClick={onAddClick} sx={{
                    flexGrow: 1,
                    display: 'flex', alignItems: 'center', minWidth: 320, p: 2.5,
                    border: '1px dashed rgba(0,0,0,0.2)', borderRadius: '16px',
                    cursor: 'pointer', transition: 'all 0.2s', gap: 2,
                    '&:hover': {bgcolor: '#fbfbfb', borderColor: 'rgba(0,0,0,0.3)'}
                }}>
                    <DefaultIcon inheritViewBox opacity={0.3}/>
                    <Typography color="text.disabled" fontWeight={500}
                                sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <span style={{fontSize: '1.2rem'}}>+</span> {addLabel}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}