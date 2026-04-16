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

export default function FacultyView({data, onAddClick, onRefresh}: any) {

    const intl = useIntl();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: any) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedFaculty(item);
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteFaculty(selectedFaculty.id);
            onRefresh();
            setIsDeleteModalOpen(false);
        } catch (e) {
            // TODO: change to snackbar maybe
            alert(intl.formatMessage({id: 'structures.faculty.errors.delete'}));
        }
    };

    return (
        <Box>
            <TileView
                items={data}
                icon={AccountBalance}
                getTitle={(item: any) => item.faculty_short}
                getSubtitle={(item: any) => item.faculty_name}
                onItemClick={(item: any) => navigate(`/structures/faculty/${item.id}`)}
                onMenuOpen={handleMenuOpen}
                onAddClick={onAddClick}
                addLabel={intl.formatMessage({id: 'structures.faculty.add'})}
            />

            <ActionMenu
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                onEdit={() => setIsEditModalOpen(true)}
                onDelete={() => setIsDeleteModalOpen(true)}
                editLabel={intl.formatMessage({id: 'structures.faculty.edit'})}
                deleteLabel={intl.formatMessage({id: 'structures.faculty.delete'})}
            />

            <FacultyModal open={isEditModalOpen} faculty={selectedFaculty} onClose={() => setIsEditModalOpen(false)}
                          onSuccess={onRefresh}/>
            <DeleteConfirmDialog open={isDeleteModalOpen}
                                 title={intl.formatMessage({id: 'structures.faculty.deleteTitle'})}
                                 description={intl.formatMessage({id: 'structures.faculty.deleteDesc'})}
                                 onConfirm={handleConfirmDelete}
                                 onClose={() => setIsDeleteModalOpen(false)}
                                 cancelButtonLabel={intl.formatMessage({id: 'structures.common.cancel'})}
                                 confirmButtonLabel={intl.formatMessage({id: 'structures.faculty.delete'})}
            />
        </Box>
    );
}