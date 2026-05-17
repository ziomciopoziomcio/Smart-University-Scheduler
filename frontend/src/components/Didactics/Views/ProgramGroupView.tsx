import {useState, useEffect} from "react";
import {Box, Typography, Tooltip} from '@mui/material';
import {useIntl} from 'react-intl';
import {useNavigate} from 'react-router-dom';
import GroupsIcon from '@mui/icons-material/Groups';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
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
    fieldName: string;
    onRefresh: () => void;
}

export function ProgramGroupView({data, facultyId, programId, semesterId, fieldId, fieldName, onRefresh}: ProgramGroupViewProps) {
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
                rowSx={(item) => ({
                    opacity: item.is_active ? 1 : 0.5,
                    transition: 'opacity 0.2s ease-in-out'
                })}
                columns={[
                    {
                        render: (item) => {
                            if (item.major) {
                                const majorName = majors.find(m => m.id === item.major)?.major_name || item.major.toString();
                                return (
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                        <ClassOutlinedIcon sx={{fontSize: 18, color: 'primary.main', opacity: 0.8}}/>
                                        <Typography variant="body2">
                                            {intl.formatMessage({id: 'didactics.programs.groups.chip.major'}, {name: majorName})}
                                        </Typography>
                                    </Box>
                                );
                            }
                            if (item.elective_block) {
                                const blockName = blocks.find(b => b.id === item.elective_block)?.elective_block_name || item.elective_block.toString();
                                return (
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                        <ExtensionOutlinedIcon sx={{fontSize: 18, color: 'secondary.main', opacity: 0.8}}/>
                                        <Typography variant="body2">
                                            {intl.formatMessage({id: 'didactics.programs.groups.chip.block'}, {name: blockName})}
                                        </Typography>
                                    </Box>
                                );
                            }
                            return (
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                    <AutoStoriesIcon sx={{fontSize: 18, color: 'text.secondary', opacity: 0.6}}/>
                                    <Typography variant="body2" color="text.secondary">
                                        {fieldName || intl.formatMessage({id: 'didactics.programs.groups.chip.general'})}
                                    </Typography>
                                </Box>
                            );
                        },
                        width: '300px'
                    },
                    {
                        render: (item) => (
                            <Tooltip title={intl.formatMessage({id: item.is_active ? 'didactics.programs.groups.active' : 'didactics.programs.groups.inactive'})}>
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    {item.is_active ?
                                        <CheckCircleOutlineIcon sx={{color: 'success.main', fontSize: 20}}/> :
                                        <HighlightOffIcon sx={{color: 'error.main', fontSize: 20}}/>
                                    }
                                </Box>
                            </Tooltip>
                        ),
                        width: '80px',
                        align: 'center'
                    },
                    {
                        render: (item) => intl.formatMessage({id: 'didactics.programs.groups.studentsCount'}, {count: item.students_count ?? 0}),
                        variant: 'secondary',
                        width: '120px',
                        align: 'right'
                    }
                ]}
                onItemClick={(item) => {
                    navigate(`/didactics/fields/faculty/${facultyId}/field/${fieldId}/program/${programId}/semester/${semesterId}/groups/${item.id}`);
                }}
                onMenuOpen={(e, item) => {
                    setAnchorEl(e.currentTarget);
                    setSelectedGroup(item);
                }}
                onAddClick={() => {
                    setSelectedGroup(null);
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({id: 'didactics.programs.groups.add'})}
                emptyMessage={intl.formatMessage({id: 'didactics.programs.groups.empty'})}
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
                editLabel={intl.formatMessage({id: 'didactics.common.edit'})}
                deleteLabel={intl.formatMessage({id: 'didactics.common.delete'})}
            />

            <DeleteConfirmDialog
                open={isDeleteOpen}
                title={intl.formatMessage({id: 'didactics.programs.groups.deleteTitle'})}
                description={intl.formatMessage({id: 'didactics.programs.groups.deleteDesc'}, {name: selectedGroup?.group_name})}
                onClose={() => {
                    setIsDeleteOpen(false);
                }}
                onConfirm={handleConfirmDelete}
                cancelButtonLabel={intl.formatMessage({id: 'didactics.common.cancel'})}
                confirmButtonLabel={intl.formatMessage({id: 'didactics.common.delete'})}
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
