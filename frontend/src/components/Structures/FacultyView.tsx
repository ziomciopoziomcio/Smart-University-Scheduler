import {useState} from 'react';
import {Box} from '@mui/material';
import {AccountBalance} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {deleteFaculty} from '@api/structures';
import FacultyModal from './FacultyModal';
import DeleteConfirmDialog from "@components/Common/DeleteConfirmDialog.tsx";
import TileView from "@components/Common/TileView.tsx";
import {useIntl} from "react-intl";
import ActionMenu from "@components/Common/ActionMenu.tsx";
import type {Faculty} from '@api/types';

interface FacultyViewProps {
    data: Faculty[];
    onAddClick?: () => void;
    onRefresh: () => void;
}

export default function FacultyView({data, onRefresh}: FacultyViewProps) {

    const intl = useIntl();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);


    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: Faculty) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedFaculty(item);
    };

    const handleAddClick = () => {
        setSelectedFaculty(null);
        setIsEditModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedFaculty) return;
        try {
            await deleteFaculty(selectedFaculty.id);
            onRefresh();
            setIsDeleteModalOpen(false);
            setSelectedFaculty(null);
        } catch {
            alert(intl.formatMessage({id: 'structures.faculty.errors.delete'}));
        }
    };

    return (
        <Box>
            <TileView
                items={data}
                icon={AccountBalance}
                variant="flat"
                iconSize={50}
                getTitle={(item: Faculty) => item.faculty_short}
                getSubtitle={(item: Faculty) => item.faculty_name}
                onItemClick={(item: Faculty) => {
                    navigate(`/structures/faculty/${item.id}`);
                }}
                onMenuOpen={handleMenuOpen}
                onAddClick={handleAddClick}
                addLabel={intl.formatMessage({id: 'structures.faculty.add'})}
            />

            <ActionMenu
                anchorEl={anchorEl}
                onClose={() => {
                    setAnchorEl(null);
                }}
                onEdit={() => {
                    setIsEditModalOpen(true);
                }}
                onDelete={() => {
                    setIsDeleteModalOpen(true);
                }}
                editLabel={intl.formatMessage({id: 'structures.faculty.edit'})}
                deleteLabel={intl.formatMessage({id: 'structures.faculty.delete'})}
            />

            <FacultyModal open={isEditModalOpen} faculty={selectedFaculty} onClose={() => {
                setIsEditModalOpen(false);
            }}
                          onSuccess={onRefresh}/>
            <DeleteConfirmDialog open={isDeleteModalOpen}
                                 title={intl.formatMessage({id: 'structures.faculty.deleteTitle'})}
                                 description={intl.formatMessage({id: 'structures.faculty.deleteDesc'})}
                                 onConfirm={() => {
                                     void handleConfirmDelete();
                                 }}
                                 onClose={() => {
                                     setIsDeleteModalOpen(false);
                                 }}
                                 cancelButtonLabel={intl.formatMessage({id: 'structures.common.cancel'})}
                                 confirmButtonLabel={intl.formatMessage({id: 'structures.faculty.delete'})}
            />
        </Box>
    );
}