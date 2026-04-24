import {useState, useEffect} from 'react';
import {Box} from '@mui/material';
import {Extension} from '@mui/icons-material';
import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {type ElectiveBlock, fetchElectiveBlocks, deleteElectiveBlock} from '@api';
import {BlockModal} from '../Modals/BlockModal.tsx';
import {useIntl} from 'react-intl';

export function BlockView({fieldId}: { fieldId: number }) {
    const intl = useIntl();
    const [data, setData] = useState<ElectiveBlock[]>([]);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selected, setSelected] = useState<ElectiveBlock | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const load = async () => {
        const res = await fetchElectiveBlocks(100, 0, {study_field: fieldId});
        setData(res?.items || (Array.isArray(res) ? res : []));
    };

    useEffect(() => {
        void load();
    }, [fieldId]);

    return (
        <Box>
            <ListView<ElectiveBlock>
                items={data}
                icon={Extension}
                getTitle={(item) => item.elective_block_name}
                onMenuOpen={(e, item) => {
                    setAnchorEl(e.currentTarget);
                    setSelected(item);
                }}
                onAddClick={() => {
                    setSelected(null);
                    setIsModalOpen(true);
                }}
                addLabel="Dodaj Blok"
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
                title={intl.formatMessage({id: 'didactics.blocks.deleteTitle'})}
                description={intl.formatMessage({id: 'didactics.blocks.deleteDesc'}, {name: selected?.elective_block_name})}
                cancelButtonLabel={intl.formatMessage({id: 'didactics.common.cancel'})}
                confirmButtonLabel={intl.formatMessage({id: 'didactics.common.delete'})}
                onConfirm={async () => {
                    if (selected) await deleteElectiveBlock(selected.id);
                    void load();
                    setIsDeleteOpen(false);
                }}
                onClose={() => setIsDeleteOpen(false)}
            />

            <BlockModal open={isModalOpen} block={selected} fieldId={fieldId} onClose={() => setIsModalOpen(false)}
                        onSuccess={load}/>
        </Box>
    );
}