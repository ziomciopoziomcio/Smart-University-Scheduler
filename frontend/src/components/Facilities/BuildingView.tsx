import {useState} from 'react';
import {Box, Menu, MenuItem, ListItemIcon, ListItemText} from '@mui/material';
import {EditOutlined, DeleteOutline} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';

// @ts-expect-error
import buildingIcon from '@assets/icons/building.svg?react';
import {type Building} from '@api/types';
import {deleteBuilding} from '@api/facilities';
import BuildingModal from './BuildingModal.tsx';
import DeleteConfirmDialog from '@components/Common/DeleteConfirmDialog';
import ListView from '@components/Common/ListView';

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

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: any) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedBuilding(item);
    };

    const handleMenuClose = () => setAnchorEl(null);

    const confirmDelete = async () => {
        if (!selectedBuilding) return;
        setIsDeleting(true);
        try {
            await deleteBuilding(selectedBuilding.id);
            setIsDeleteModalOpen(false);
            onRefresh();
        } catch (error) {
            alert(intl.formatMessage({id: 'facilities.building.errors.delete'}));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Box>
            <ListView
                items={data}
                icon={buildingIcon}
                getTitle={(item: any) => `${intl.formatMessage({id: 'facilities.breadcrumbs.building'})} ${item.building_number}`}
                titleWidth="150px"
                columns={[
                    {
                        render: (item: any) => item.building_name || intl.formatMessage({id: 'facilities.common.noName'}),
                        variant: 'secondary',
                        width: '250px'
                    },
                    {
                        // TODO: get room count from API (waiting for endpoint)
                        render: () => `? ${intl.formatMessage({id: 'facilities.room.rooms'})}`,
                        variant: 'secondary',
                        width: '100px'
                    }
                ]}

                onItemClick={(item: any) => navigate(`/facilities/campus/${campusId}/building/${item.id}`)}
                onMenuOpen={handleMenuOpen}
                onAddClick={() => {
                    setSelectedBuilding(null);
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({id: 'facilities.building.add'})}
                emptyMessage={intl.formatMessage({id: 'facilities.common.noData'})}
            />

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} PaperProps={{
                sx: {
                    borderRadius: '12px',
                    minWidth: '180px',
                    boxShadow: '0px 4px 20px rgba(0,0,0,0.08)'
                }
            }}>
                <MenuItem onClick={() => {
                    handleMenuClose();
                    setIsModalOpen(true);
                }} sx={{py: 1.5}}>
                    <ListItemIcon><EditOutlined fontSize="small"/></ListItemIcon>
                    <ListItemText>{intl.formatMessage({id: 'facilities.building.edit'})}</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => {
                    handleMenuClose();
                    setIsDeleteModalOpen(true);
                }} sx={{py: 1.5, color: 'error.main'}}>
                    <ListItemIcon><DeleteOutline fontSize="small" color="error"/></ListItemIcon>
                    <ListItemText>{intl.formatMessage({id: 'facilities.building.delete'})}</ListItemText>
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
                title={intl.formatMessage({id: 'facilities.building.deleteTitle'})}
                description={intl.formatMessage({id: 'facilities.building.deleteDesc'})}
                cancelButtonLabel={intl.formatMessage({id: 'facilities.common.cancel'})}
                confirmButtonLabel={intl.formatMessage({id: 'facilities.building.delete'})}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
            />
        </Box>
    );
}