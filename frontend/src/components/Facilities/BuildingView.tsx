// TODO: when available, replace alert with proper error handling (e.g. snackbar)
// TODO: loading state for delete action, disable buttons while loading
// TODO: visuals (justify better)
// TODO: when endppoint available, show number of rooms in building in the list
// TODO: searchbar
import {useState} from 'react';
import {
    Box,
    Typography,
    Divider,
    Button,
    IconButton,
    SvgIcon,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {Add, MoreVert, EditOutlined, DeleteOutline} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';

// @ts-expect-error
import buildingIcon from '@assets/icons/building.svg?react';

import {type Building} from '@api/types';
import {deleteBuilding} from '@api/facilities';
import BuildingModal from './BuildingModal.tsx';
import DeleteConfirmDialog from '@components/Common/DeleteConfirmDialog';

interface BuildingViewProps {
    data: Building[];
    campusId: number;
    onRefresh: () => void;
}

export default function BuildingView({data, campusId, onRefresh}: BuildingViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, building: Building) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setSelectedBuilding(building);
    };

    const handleMenuClose = () => setAnchorEl(null);

    const handleOpenAdd = () => {
        setSelectedBuilding(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleMenuClose();
        setIsModalOpen(true);
    };

    const handleOpenDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleMenuClose();
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedBuilding) return;
        setIsDeleting(true);
        try {
            await deleteBuilding(selectedBuilding.id);
            setIsDeleteModalOpen(false);
            onRefresh();
        } catch (error) {
            alert('Wystąpił błąd podczas usuwania.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Box>
            {data.length === 0 && (
                <Typography color="text.secondary" textAlign="center" py={4}>
                    {intl.formatMessage({id: 'facilities.noData'})}
                </Typography>
            )}

            {data.map((item) => (
                <Box key={item.id}>
                    <Box
                        onClick={() => navigate(`/facilities/building/${item.id}`)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            py: 2,
                            cursor: 'pointer',
                            '&:hover': {bgcolor: '#fbfbfb'}
                        }}
                    >
                        <Box sx={{mr: 3, display: 'flex', alignItems: 'center'}}>
                            <SvgIcon component={buildingIcon} inheritViewBox
                                     sx={{fontSize: 28, color: 'rgba(0,0,0,0.4)'}}/>
                        </Box>

                        <Box sx={{flexGrow: 1, display: 'flex', alignItems: 'center'}}>
                            <Typography fontWeight={600} sx={{width: '150px'}}>
                                {intl.formatMessage({id: 'facilities.breadcrumbs.building'})} {item.building_number}
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{flexGrow: 1}}>
                                {item.building_name || intl.formatMessage({id: 'facilities.noName'})}
                            </Typography>

                            <Typography variant="body2" color="text.disabled" sx={{mr: 2}}>
                                ? {intl.formatMessage({id: 'facilities.rooms'})}
                            </Typography>
                        </Box>

                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, item)}>
                            <MoreVert sx={{color: '#aaa'}}/>
                        </IconButton>
                    </Box>
                    <Divider/>
                </Box>
            ))}

            <Button startIcon={<Add/>} onClick={handleOpenAdd}
                    sx={{mt: 2, color: 'text.secondary', textTransform: 'none', fontWeight: 500}}>
                {intl.formatMessage({id: 'facilities.addBuilding'})}
            </Button>

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

            <BuildingModal
                open={isModalOpen}
                campusId={campusId}
                building={selectedBuilding}
                onClose={() => setIsModalOpen(false)}
                onSuccess={onRefresh}
            />

            <DeleteConfirmDialog
                open={isDeleteModalOpen}
                loading={isDeleting}
                title={intl.formatMessage({id: 'facilities.deleteConfirm.titleBuilding'})}
                description={intl.formatMessage({id: 'facilities.deleteConfirm.descriptionBuilding'})}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
            />
        </Box>
    );
}