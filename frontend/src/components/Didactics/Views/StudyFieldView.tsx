import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Box, Typography} from '@mui/material';
import {AutoStories, ClassOutlined, ExtensionOutlined, FolderSpecialOutlined} from '@mui/icons-material';
import {useIntl} from 'react-intl';

import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {type StudyField, deleteStudyField} from '@api';
import {StudyFieldModal} from '@components/Didactics';

interface DidacticsStudyFieldViewProps {
    data: StudyField[];
    facultyId: number;
    onRefresh: () => void;
}

export function DidacticsStudyFieldView({data, facultyId, onRefresh}: DidacticsStudyFieldViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedField, setSelectedField] = useState<StudyField | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = async () => {
        if (!selectedField) return;
        setIsDeleting(true);
        try {
            await deleteStudyField(selectedField.id);
            setIsDeleteOpen(false);
            onRefresh();
        } catch {
            alert('Error deleting'); // TODO: snackbar
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Box sx={{width: '100%'}}>
            <ListView<StudyField>
                items={data || []}
                icon={AutoStories}
                getTitle={(item) => item.field_name}
                columns={[
                    {
                        render: (item: StudyField) => (
                            <Box sx={{display: 'flex', gap: 1}}>
                                <Typography variant="body2" color="text.secondary">
                                    {item.degree ? intl.formatMessage({id: `didactics.fields.degrees.${item.degree}`}) : '—'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">•</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {item.mode ? intl.formatMessage({id: `didactics.fields.modes.${item.mode}`}) : '—'}
                                </Typography>
                            </Box>
                        ),
                        width: '220px'
                    },
                    {
                        render: (item: StudyField) => intl.formatMessage(
                            {id: 'didactics.fields.majorsCount'},
                            {count: item.specializations_count ?? 0}
                        ),
                        icon: ClassOutlined,
                        variant: 'secondary',
                        width: '150px'
                    },
                    {
                        render: (item: StudyField) => intl.formatMessage(
                            {id: 'didactics.fields.blocksCount'},
                            {count: item.elective_blocks_count ?? 0}
                        ),
                        icon: ExtensionOutlined,
                        variant: 'secondary',
                        width: '150px'
                    },
                    {
                        render: (item: StudyField) => intl.formatMessage(
                            {id: 'programs.fields.programsCount'},
                            {count: item.programs_count ?? 0}
                        ),
                        icon: FolderSpecialOutlined,
                        variant: 'secondary',
                        width: '120px'
                    }
                ]}
                onItemClick={(item) => navigate(`/didactics/fields/faculty/${facultyId}/field/${item.id}`)}
                onMenuOpen={(e, item) => {
                    setAnchorEl(e.currentTarget);
                    setSelectedField(item);
                }}
                onAddClick={() => {
                    setSelectedField(null);
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({id: 'didactics.fields.add'})}
                emptyMessage={intl.formatMessage({id: 'didactics.fields.empty'})}
            />

            <ActionMenu
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
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
                loading={isDeleting}
                title={intl.formatMessage({id: 'didactics.fields.deleteTitle'})}
                description={intl.formatMessage({id: 'didactics.fields.deleteDesc'}, {name: selectedField?.field_name})}
                cancelButtonLabel={intl.formatMessage({id: 'didactics.common.cancel'})}
                confirmButtonLabel={intl.formatMessage({id: 'didactics.common.delete'})}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
            />

            <StudyFieldModal
                open={isModalOpen}
                studyField={selectedField}
                facultyId={facultyId}
                onClose={() => setIsModalOpen(false)}
                onSuccess={onRefresh}
            />
        </Box>
    );
}