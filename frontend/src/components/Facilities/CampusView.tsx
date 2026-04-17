import {useState} from 'react';
import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';

// @ts-expect-error: vite svg import workaround
import buildingIcon from '@assets/icons/buildings.svg?react';
import {deleteCampus} from '@api/facilities';
import CampusModal from './CampusModal';
import DeleteConfirmDialog from "@components/Common/DeleteConfirmDialog.tsx";
import TileView from "@components/Common/TileView.tsx";
import ActionMenu from "@components/Common/ActionMenu.tsx";
import type {Campus} from "@api/types.ts";

interface CampusViewProps {
    data: Campus[];
    onRefresh: () => void;
}

export default function CampusView({data, onRefresh}: CampusViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);
    const handleMenuClose = () => setAnchorEl(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: Campus) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedCampus(item);
    };

    const handleConfirmDelete = async () => {
        if (!selectedCampus) return;

        try {
            await deleteCampus(selectedCampus.id);
            onRefresh();
            setIsDeleteModalOpen(false);
            setSelectedCampus(null);
        } catch {            // TODO: Maybe change to snackbar
            alert(intl.formatMessage({id: 'facilities.campus.errors.delete'}));
        }
    };

    return (
        <Box>
            <TileView
                items={data}
                icon={buildingIcon}
                getTitle={(item: Campus) => item.campus_name || `${intl.formatMessage({id: 'facilities.breadcrumbs.campus'})} ${item.campus_short}`}
                getSubtitle={(item: Campus) => item.campus_short}
                onItemClick={(item: Campus) => {
                    navigate(`/facilities/campus/${item.id}`);
                }}
                onMenuOpen={handleMenuOpen}
                onAddClick={() => {
                    setSelectedCampus(null);
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({id: 'facilities.campus.add'})}
            />

            <ActionMenu
                anchorEl={anchorEl}
                onClose={handleMenuClose}
                onEdit={() => {
                    handleMenuClose();
                    setIsModalOpen(true);
                }}
                onDelete={() => {
                    handleMenuClose();
                    setIsDeleteModalOpen(true);
                }}
                editLabel={intl.formatMessage({id: 'facilities.campus.edit'})}
                deleteLabel={intl.formatMessage({id: 'facilities.campus.delete'})}
            />

            <CampusModal
                open={isModalOpen}
                campus={selectedCampus}
                onClose={() => {
                    setIsModalOpen(false);
                }}
                onSuccess={onRefresh}
            />

            <DeleteConfirmDialog
                open={isDeleteModalOpen}
                title={intl.formatMessage({id: 'facilities.campus.deleteTitle'})}
                description={intl.formatMessage({id: 'facilities.campus.deleteDesc'})}
                cancelButtonLabel={intl.formatMessage({id: 'facilities.common.cancel'})}
                confirmButtonLabel={intl.formatMessage({id: 'facilities.campus.delete'})}
                onConfirm={handleConfirmDelete}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                }}/>
        </Box>
    );
}