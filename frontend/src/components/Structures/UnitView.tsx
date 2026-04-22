import {useState} from 'react';
import {Box} from '@mui/material';
import {Groups} from '@mui/icons-material';
import {useIntl} from 'react-intl';

import {deleteUnit} from '@api/structures';
import UnitModal from './UnitModal';
import DeleteConfirmDialog from "@components/Common/DeleteConfirmDialog.tsx";
import ListView from "@components/Common/ListView.tsx";
import ActionMenu from "@components/Common/ActionMenu.tsx";
import {type Unit} from '@api/types';

interface UnitViewProps {
    data: Unit[];
    facultyId: number;
    onRefresh: () => void;
}

export default function UnitView({data, facultyId, onRefresh}: UnitViewProps) {
    const intl = useIntl();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: Unit) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedUnit(item);
    };

    const handleConfirmDelete = async () => {
        if (!selectedUnit) return;
        try {
            await deleteUnit(selectedUnit.id);
            onRefresh();
            setIsDeleteModalOpen(false);
            setSelectedUnit(null);
        } catch {
            alert(intl.formatMessage({id: 'structures.unit.errors.delete'}));
        }
    };

    return (
        <Box>
            <ListView
                items={data}
                icon={Groups}
                getTitle={(item: Unit) => item.unit_name}
                titleWidth="350px"

                columns={[
                    {
                        render: (item: Unit) => item.unit_short,
                        variant: 'secondary',
                        width: '150px'
                    }
                ]}

                onMenuOpen={handleMenuOpen}

                onAddClick={() => {
                    setSelectedUnit(null);
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({id: 'structures.unit.add'})}
                emptyMessage="Brak jednostek dla tego wydziału."
            />

            <ActionMenu
                anchorEl={anchorEl}
                onClose={() => {
                    setAnchorEl(null);
                }}
                onEdit={() => {
                    setIsModalOpen(true);
                }}
                onDelete={() => {
                    setIsDeleteModalOpen(true);
                }}
                editLabel={intl.formatMessage({id: 'structures.unit.edit'})}
                deleteLabel={intl.formatMessage({id: 'structures.unit.delete'})}
            />

            <UnitModal
                open={isModalOpen}
                facultyId={facultyId}
                unit={selectedUnit}
                onClose={() => {
                    setIsModalOpen(false);
                }}
                onSuccess={onRefresh}
            />

            <DeleteConfirmDialog
                open={isDeleteModalOpen}
                title={intl.formatMessage({id: 'structures.unit.deleteTitle'})}
                description={intl.formatMessage({id: 'structures.unit.deleteDesc'})}
                cancelButtonLabel={intl.formatMessage({id: 'facilities.common.cancel'})}
                confirmButtonLabel={intl.formatMessage({id: 'facilities.common.deleteConfirm'})}
                onConfirm={() => {
                    void handleConfirmDelete();
                }}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                }}
            />
        </Box>
    );
}