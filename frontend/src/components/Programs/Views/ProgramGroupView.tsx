import {useState, useEffect} from "react";
import {Box, Chip} from '@mui/material';
import {useIntl} from 'react-intl';
import {useNavigate} from 'react-router-dom';
import GroupsIcon from '@mui/icons-material/Groups';
import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {
    type Group,
    type Major,
    type ElectiveBlock,
    deleteGroup,
    fetchMajors,
    fetchElectiveBlocks
} from '@api';
import {ProgramGroupModal} from '../Modals/ProgramGroupModal';

interface ProgramGroupViewProps {
    data: Group[];
    facultyId: number;
    programId: number;
    semesterId: number;
    fieldId: number;
    onRefresh: () => void;
}

export function ProgramGroupView({data, facultyId, programId, semesterId, fieldId, onRefresh}: ProgramGroupViewProps) {
    const intl = useIntl();
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [majors, setMajors] = useState<Major[]>([]);
    const [blocks, setBlocks] = useState<ElectiveBlock[]>([]);

    useEffect(() => {
        if (fieldId) {
            fetchMajors(1, 100, undefined, {study_field: fieldId})
                .then(res => {
                    setMajors(res.items || []);
                })
                .catch(console.error);

            fetchElectiveBlocks(1, 100, undefined, {study_field: fieldId})
                .then(res => {
                    setBlocks(res.items || []);
                })
                .catch(console.error);
        }
    }, [fieldId]);

    const handleConfirmDelete = async () => {
        if (!selectedGroup) return;
        try {
            await deleteGroup(selectedGroup.id);
            setIsDeleteOpen(false);
            onRefresh();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Box>
            <ListView<Group>
                items={data}
                icon={GroupsIcon}
                getTitle={(item) => item.group_name}
                columns={[
                    {
                        render: (item) => {
                            if (item.major) {
                                const majorName = majors.find(m => m.id === item.major)?.major_name || item.major.toString();
                                return <Chip size="small"
                                             label={intl.formatMessage({id: 'programs.groups.chip.major'}, {name: majorName})}
                                             color="primary" variant="outlined"/>;
                            }
                            if (item.elective_block) {
                                const blockName = blocks.find(b => b.id === item.elective_block)?.elective_block_name || item.elective_block.toString();
                                return <Chip size="small"
                                             label={intl.formatMessage({id: 'programs.groups.chip.block'}, {name: blockName})}
                                             color="secondary" variant="outlined"/>;
                            }
                            return <Chip size="small" label={intl.formatMessage({id: 'programs.groups.chip.general'})}
                                         variant="outlined" sx={{color: 'text.secondary', borderColor: 'divider'}}/>;
                        },
                        width: '300px'
                    },
                    {
                        // TODO: change to real students count when endpoint is ready - for now it is set to 0 to avoid confusion
                        render: () => intl.formatMessage({id: 'programs.groups.studentsCount'}, {count: 0}),
                        variant: 'secondary',
                        width: '150px',
                        align: 'right'
                    }
                ]}
                onItemClick={(item) => {
                    navigate(`/programs/faculty/${facultyId}/field/${fieldId}/program/${programId}/semester/${semesterId}/groups/${item.id}`);
                }}
                onMenuOpen={(e, item) => {
                    setAnchorEl(e.currentTarget);
                    setSelectedGroup(item);
                }}
                onAddClick={() => {
                    setSelectedGroup(null);
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({id: 'programs.groups.add'})}
                emptyMessage={intl.formatMessage({id: 'programs.groups.empty'})}
                hideDividerOnLastItem
            />

            <ActionMenu
                anchorEl={anchorEl}
                onClose={() => {
                    setAnchorEl(null);
                }}
                onEdit={() => {
                    setIsModalOpen(true);
                    setAnchorEl(null);
                }}
                onDelete={() => {
                    setIsDeleteOpen(true);
                    setAnchorEl(null);
                }}
                editLabel={intl.formatMessage({id: 'common.edit'})}
                deleteLabel={intl.formatMessage({id: 'common.delete'})}
            />

            <DeleteConfirmDialog
                open={isDeleteOpen}
                title={intl.formatMessage({id: 'programs.groups.deleteTitle'})}
                description={intl.formatMessage({id: 'programs.groups.deleteDesc'}, {name: selectedGroup?.group_name})}
                onClose={() => {
                    setIsDeleteOpen(false);
                }}
                onConfirm={handleConfirmDelete}
                cancelButtonLabel={intl.formatMessage({id: 'common.cancel'})}
                confirmButtonLabel={intl.formatMessage({id: 'common.delete'})}
            />

            <ProgramGroupModal
                open={isModalOpen}
                group={selectedGroup}
                programId={programId}
                semesterId={semesterId}
                fieldId={fieldId}
                onClose={() => {
                    setIsModalOpen(false);
                }}
                onSuccess={onRefresh}
            />
        </Box>
    );
}