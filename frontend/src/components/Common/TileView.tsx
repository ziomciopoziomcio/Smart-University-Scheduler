/* eslint-disable @typescript-eslint/no-unused-vars */
import {Box, Typography, IconButton, SvgIcon} from '@mui/material';
import {MoreVert} from '@mui/icons-material';

interface TileViewProps<T> {
    items: T[];
    icon: React.ElementType;
    getTitle: (item: T) => string;
    getSubtitle?: (item: T) => string | undefined;
    onItemClick: (item: T) => void;
    onMenuOpen: (e: React.MouseEvent<HTMLElement>, item: T) => void;
    onAddClick: () => void;
    addLabel: string;
}

export default function TileView<T extends { id: number | string }>({
                                                                        items,
                                                                        icon: Icon,
                                                                        getTitle,
                                                                        getSubtitle,
                                                                        onItemClick,
                                                                        onMenuOpen,
                                                                        onAddClick,
                                                                        addLabel
                                                                    }: TileViewProps<T>) {
    return (
        <Box sx={{display: 'flex', gap: 3, flexWrap: 'wrap'}}>
            {items.map((item) => (
                <Box
                    key={item.id}
                    onClick={() => {
                        onItemClick(item);
                    }} sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    minWidth: 320, p: 2.5, border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s',
                    '&:hover': {borderColor: 'rgba(0,0,0,0.2)', bgcolor: '#fbfbfb', transform: 'translateY(-2px)'}
                }}
                >
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                        <SvgIcon component={Icon} inheritViewBox sx={{fontSize: 48, color: 'rgba(0,0,0,0.4)'}}/>
                        <Box
                            sx={{display: 'flex', flexDirection: 'column', alignItems: 'start'}}>
                            <Typography sx={{fontWeight: 600, textAlign: 'start'}}>{getTitle(item)}</Typography>
                            {getSubtitle && (
                                <Typography variant="body2" color="text.secondary" sx={{textAlign: 'start'}}>
                                    {getSubtitle(item)}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    <IconButton size="small" onClick={(e) => {
                        onMenuOpen(e, item);
                    }}> <MoreVert/>
                    </IconButton>
                </Box>
            ))}

            <Box onClick={onAddClick} sx={{
                display: 'flex', alignItems: 'center', width: 320, p: 2.5,
                border: '1px dashed rgba(0,0,0,0.2)', borderRadius: '16px',
                cursor: 'pointer', transition: 'all 0.2s', gap: 2,
                '&:hover': {bgcolor: '#fbfbfb', borderColor: 'rgba(0,0,0,0.3)'}
            }}>
                <Icon inheritViewBox opacity={0.3}/>
                <Typography color="text.disabled" fontWeight={500} sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <span style={{fontSize: '1.2rem'}}>+</span> {addLabel}
                </Typography>
            </Box>
        </Box>
    );
}