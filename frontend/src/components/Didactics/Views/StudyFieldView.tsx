import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Box, Typography} from '@mui/material';
import {AutoStories, ClassOutlined, ExtensionOutlined, FolderSpecialOutlined} from '@mui/icons-material';
import {useIntl} from 'react-intl';

import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {type StudyField, deleteStudyField} from '@api';
import {StudyFieldModal} from '@components/Didactics';
import {usePermissionStore} from '@store/usePermissionStore';
import {PERMISSIONS} from '@constants/permissions';

interface DidacticsStudyFieldViewProps {
    data: StudyField[];
    facultyId: number;
    onRefresh: () => void;
}

export function DidacticsStudyFieldView({data, facultyId, onRefresh}: DidacticsStudyFieldViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    const canCreateStudyField = hasAnyPermission([PERMISSIONS.STUDY_FIELD_CREATE]);
    const canUpdateStudyField = hasAnyPermission([PERMISSIONS.STUDY_FIELD_UPDATE]);
    const canDeleteStudyField = hasAnyPermission([PERMISSIONS.STUDY_FIELD_DELETE]);
    const canUseStudyFieldActions = canUpdateStudyField || canDeleteStudyField;

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedField, setSelectedField] = useState<StudyField | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: StudyField) => {
        if (!canUseStudyFieldActions) {
            return;
        }

        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedField(item);
    };

    const handleAddClick = () => {
        if (!canCreateStudyField) {
            return;
        }

        setSelectedField(null);
        setIsModalOpen(true);
    };

    const handleEditClick = () => {
        if (!canUpdateStudyField) {
            return;
        }

        setIsModalOpen(true);
        handleMenuClose();
    };

    const handleDeleteClick = () => {
        if (!canDeleteStudyField) {
            return;
        }

        setIsDeleteOpen(true);
        handleMenuClose();
    };

    const handleConfirmDelete = async () => {
        if (!selectedField || !canDeleteStudyField) {
            return;
        }

        setIsDeleting(true);

        try {
            await deleteStudyField(selectedField.id);
            setIsDeleteOpen(false);
            setSelectedField(null);
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
                        width: '220px',
                    },
                    {
                        render: (item: StudyField) => intl.formatMessage(
                            {id: 'didactics.fields.majorsCount'},
                            {count: item.specializations_count ?? 0},
                        ),
                        icon: ClassOutlined,
                        variant: 'secondary',
                        width: '150px',
                    },
                    {
                        render: (item: StudyField) => intl.formatMessage(
                            {id: 'didactics.fields.blocksCount'},
                            {count: item.elective_blocks_count ?? 0},
                        ),
                        icon: ExtensionOutlined,
                        variant: 'secondary',
                        width: '150px',
                    },
                    {
                        render: (item: StudyField) => intl.formatMessage(
                            {id: 'didactics.fields.programsCount'},
                            {count: item.programs_count ?? 0},
                        ),
                        icon: FolderSpecialOutlined,
                        variant: 'secondary',
                        width: '120px',
                    },
                ]}
                onItemClick={(item) => {
                    navigate(`/didactics/fields/faculty/${facultyId}/field/${item.id}`);
                }}
                onMenuOpen={canUseStudyFieldActions ? handleMenuOpen : undefined}
                onAddClick={canCreateStudyField ? handleAddClick : undefined}
                addLabel={intl.formatMessage({id: 'didactics.fields.add'})}
                emptyMessage={intl.formatMessage({id: 'didactics.fields.empty'})}
            />

            {canUseStudyFieldActions && (
                <ActionMenu
                    anchorEl={anchorEl}
                    onClose={handleMenuClose}
                    onEdit={canUpdateStudyField ? handleEditClick : undefined}
                    onDelete={canDeleteStudyField ? handleDeleteClick : undefined}
                    editLabel={intl.formatMessage({id: 'didactics.common.edit'})}
                    deleteLabel={intl.formatMessage({id: 'didactics.common.delete'})}
                />
            )}

            {canDeleteStudyField && (
                <DeleteConfirmDialog
                    open={isDeleteOpen}
                    loading={isDeleting}
                    title={intl.formatMessage({id: 'didactics.fields.deleteTitle'})}
                    description={intl.formatMessage(
                        {id: 'didactics.fields.deleteDesc'},
                        {name: selectedField?.field_name},
                    )}
                    cancelButtonLabel={intl.formatMessage({id: 'didactics.common.cancel'})}
                    confirmButtonLabel={intl.formatMessage({id: 'didactics.common.delete'})}
                    onClose={() => {
                        setIsDeleteOpen(false);
                    }}
                    onConfirm={handleConfirmDelete}
                />
            )}

            {(canCreateStudyField || canUpdateStudyField) && (
                <StudyFieldModal
                    open={isModalOpen}
                    studyField={selectedField}
                    facultyId={facultyId}
                    onClose={() => {
                        setIsModalOpen(false);
                    }}
                    onSuccess={onRefresh}
                />
            )}
        </Box>
    );
}