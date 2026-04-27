import {useState, useEffect} from 'react';
import {Box} from '@mui/material';
import {Class} from '@mui/icons-material';
import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {type Major, fetchMajors, deleteMajor} from '@api';
import {MajorModal} from '../Modals/MajorModal.tsx';
import {useIntl} from 'react-intl';

export function MajorView({fieldId}: { fieldId: number }) {
    const intl = useIntl();
    const [data, setData] = useState<Major[]>([]);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selected, setSelected] = useState<Major | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const load = async () => {
        const res = await fetchMajors(100, 0, {study_field: fieldId});
        setData(res?.items || (Array.isArray(res) ? res : []));
    };

    useEffect(() => {
        void load();
    }, [fieldId]);

    return (

        <Box>
            <ListView<Major>
                items={data || []}
                icon={Class}
                getTitle={(item) => item.major_name}
                onMenuOpen={(e, item) => {
                    setAnchorEl(e.currentTarget);
                    setSelected(item);
                }}
                onAddClick={() => {
                    setSelected(null);
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({id: 'didactics.majors.add'})}
            />
            <ActionMenu
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                onEdit={() => setIsModalOpen(true)}
                onDelete={() => setIsDeleteOpen(true)}
                editLabel={intl.formatMessage({id: 'didactics.common.edit'})}
                deleteLabel={intl.formatMessage({id: 'didactics.common.delete'})}
            />

            <DeleteConfirmDialog
                open={isDeleteOpen}
                title={intl.formatMessage({id: 'didactics.majors.deleteTitle'})}
                description={intl.formatMessage({id: 'didactics.majors.deleteDesc'}, {name: selected?.major_name})}
                cancelButtonLabel={intl.formatMessage({id: 'didactics.common.cancel'})}
                confirmButtonLabel={intl.formatMessage({id: 'didactics.common.delete'})}
                onConfirm={async () => {
                    if (selected) await deleteMajor(selected.id);
                    void load();
                    setIsDeleteOpen(false);
                }}
                onClose={() => setIsDeleteOpen(false)}
            />

            <MajorModal open={isModalOpen} major={selected} fieldId={fieldId} onClose={() => setIsModalOpen(false)}
                        onSuccess={load}/>
        </Box>
    );
}