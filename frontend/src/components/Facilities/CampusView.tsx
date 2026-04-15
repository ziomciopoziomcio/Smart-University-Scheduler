import {useState} from 'react';
import {
    Box,
    Typography,
    IconButton,
    SvgIcon,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {EditOutlined, DeleteOutline} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
// @ts-expect-error
import buildingIcon from '@assets/icons/buildings.svg?react';
// @ts-expect-error
import threeDots from '@assets/icons/three-dots-vertical.svg?react';

import {deleteCampus} from '@api/facilities';
import EditCampusModal from './EditCampusModal';
import DeleteConfirmDialog from "@components/Common/DeleteConfirmDialog.tsx";

interface CampusViewProps {
    data: any[];
    onAddClick: () => void;
    onRefresh: () => void;
}

export default function CampusView({data, onAddClick, onRefresh}: CampusViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedCampus, setSelectedCampus] = useState<any | null>(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, campus: any) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setSelectedCampus(campus);
    };

    const handleMenuClose = () => setAnchorEl(null);

    const handleOpenEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleMenuClose();
        setIsEditModalOpen(true);
    };

    const handleOpenDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleMenuClose();
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedCampus) return;
        setIsDeleting(true);
        try {
            await deleteCampus(selectedCampus.id);
            setIsDeleteModalOpen(false);
            onRefresh();
        } catch (error) {
            alert('Wystąpił błąd podczas usuwania.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Box sx={{display: 'flex', gap: 3, flexWrap: 'wrap'}}>
            {data.map((item) => (
                <Box
                    key={item.id}
                    onClick={() => navigate(`/facilities/campus/${item.id}`)}
                    sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: 320, p: 2, border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                        '&:hover': {
                            borderColor: 'rgba(0,0,0,0.2)',
                            background: '#fbfbfb',
                            boxShadow: '0px 2px 8px rgba(0,0,0,0.02)'
                        }
                    }}
                >
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                        <SvgIcon component={buildingIcon} inheritViewBox/>
                        <Typography fontWeight={500} color="text.secondary">
                            {item.campus_name || item.campus_short}
                        </Typography>
                    </Box>

                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, item)}>
                        <SvgIcon component={threeDots} inheritViewBox/>
                    </IconButton>
                </Box>
            ))}

            <Box onClick={onAddClick} sx={{
                display: 'flex',
                alignItems: 'center',
                width: 320,
                p: 2,
                border: '1px dashed rgba(0,0,0,0.15)',
                borderRadius: '12px',
                cursor: 'pointer',
                '&:hover': {borderColor: 'rgba(0,0,0,0.3)', bgcolor: '#fbfbfb'}
            }}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                    <SvgIcon component={buildingIcon} inheritViewBox opacity={0.3}/>
                    <Typography fontWeight={500}
                                color="text.disabled">+ {intl.formatMessage({id: 'facilities.addCampus'})}</Typography>
                </Box>
            </Box>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} PaperProps={{
                sx: {
                    borderRadius: '12px',
                    minWidth: '180px',
                    boxShadow: '0px 4px 20px rgba(0,0,0,0.08)'
                }
            }}>
                <MenuItem onClick={handleOpenEdit} sx={{py: 1.5}}>
                    <ListItemIcon><EditOutlined fontSize="small"/></ListItemIcon>
                    <ListItemText>{intl.formatMessage({id: 'facilities.menu.edit'})}</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleOpenDelete} sx={{py: 1.5, color: 'error.main'}}>
                    <ListItemIcon><DeleteOutline fontSize="small" color="error"/></ListItemIcon>
                    <ListItemText>{intl.formatMessage({id: 'facilities.menu.delete'})}</ListItemText>
                </MenuItem>
            </Menu>

            <EditCampusModal
                open={isEditModalOpen}
                campus={selectedCampus}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={onRefresh}
            />

            <DeleteConfirmDialog
                open={isDeleteModalOpen}
                loading={isDeleting}
                title={intl.formatMessage({id: 'facilities.deleteConfirm.title'})}
                description={intl.formatMessage({id: 'facilities.deleteConfirm.description'})}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
            />

        </Box>
    );
}