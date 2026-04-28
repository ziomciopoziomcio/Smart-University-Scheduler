import {useState} from 'react';
import {Box} from '@mui/material';
import {Extension} from '@mui/icons-material';
import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {type ElectiveBlock, deleteElectiveBlock} from '@api';
import {BlockModal} from '../Modals/BlockModal.tsx';
import {useIntl} from 'react-intl';

export function BlockView({fieldId, data, onRefresh}: {
    fieldId: number,
    data: ElectiveBlock[],
    onRefresh: () => void
}) {
    const intl = useIntl();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selected, setSelected] = useState<ElectiveBlock | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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
                addLabel={intl.formatMessage({id: 'didactics.blocks.add'})}
            />

            <ActionMenu anchorEl={anchorEl} onClose={() => setAnchorEl(null)} onEdit={() => setIsModalOpen(true)}
                        onDelete={() => setIsDeleteOpen(true)}
                        editLabel={intl.formatMessage({id: 'didactics.common.edit'})}
                        deleteLabel={intl.formatMessage({id: 'didactics.common.delete'})}/>

            <DeleteConfirmDialog open={isDeleteOpen} title={intl.formatMessage({id: 'didactics.blocks.deleteTitle'})}
                                 description={intl.formatMessage({id: 'didactics.blocks.deleteDesc'}, {name: selected?.elective_block_name})}
                                 cancelButtonLabel={intl.formatMessage({id: 'didactics.common.cancel'})}
                                 confirmButtonLabel={intl.formatMessage({id: 'didactics.common.delete'})}
                                 onConfirm={async () => {
                                     if (selected) await deleteElectiveBlock(selected.id);
                                     onRefresh();
                                     setIsDeleteOpen(false);
                                 }}
                                 onClose={() => setIsDeleteOpen(false)}
            />

            <BlockModal open={isModalOpen} block={selected} fieldId={fieldId} onClose={() => setIsModalOpen(false)}
                        onSuccess={onRefresh}/>
        </Box>
    );
}