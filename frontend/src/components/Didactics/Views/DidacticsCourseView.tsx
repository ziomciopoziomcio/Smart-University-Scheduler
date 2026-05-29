import {useState} from 'react';
import {Box} from '@mui/material';
import {AutoStories} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {useNavigate} from 'react-router-dom';

import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {type Course, deleteCourse} from '@api';
import CourseModal from '../Modals/CourseModal.tsx';
import {usePermissionStore} from '@store/usePermissionStore';
import {PERMISSIONS} from '@constants/permissions';

type CourseListItem = Course & { id: number };

interface DidacticsCourseViewProps {
    unitId: number;
    facultyId: number;
    data: Course[];
    onRefresh: () => void;
}

export function DidacticsCourseView({unitId, facultyId, data, onRefresh}: DidacticsCourseViewProps) {
    const intl = useIntl();
    const navigate = useNavigate();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    const canCreateCourse = hasAnyPermission([PERMISSIONS.COURSE_CREATE]);
    const canUpdateCourse = hasAnyPermission([PERMISSIONS.COURSE_UPDATE]);
    const canDeleteCourse = hasAnyPermission([PERMISSIONS.COURSE_DELETE]);
    const canUseCourseActions = canUpdateCourse || canDeleteCourse;

    const canViewCourseInstructors = hasAnyPermission([
        PERMISSIONS.COURSE_INSTRUCTOR_VIEW,
    ]);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selected, setSelected] = useState<CourseListItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const itemsWithId: CourseListItem[] = data.map((item) => ({
        ...item,
        id: item.course_code,
    }));

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: CourseListItem) => {
        if (!canUseCourseActions) {
            return;
        }

        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelected(item);
    };

    const handleAddClick = () => {
        if (!canCreateCourse) {
            return;
        }

        setSelected(null);
        setIsModalOpen(true);
    };

    const handleEditClick = () => {
        if (!canUpdateCourse) {
            return;
        }

        setIsModalOpen(true);
        handleMenuClose();
    };

    const handleDeleteClick = () => {
        if (!canDeleteCourse) {
            return;
        }

        setIsDeleteOpen(true);
        handleMenuClose();
    };

    const handleItemClick = (item: CourseListItem) => {
        if (!canViewCourseInstructors) {
            return;
        }

        navigate(
            `/didactics/courses/faculty/${facultyId}/unit/${unitId}/course/${item.course_code}/instructors`,
        );
    };

    const handleConfirmDelete = async () => {
        if (!selected || !canDeleteCourse) {
            return;
        }

        await deleteCourse(selected.course_code);
        onRefresh();
        setIsDeleteOpen(false);
        setSelected(null);
    };

    return (
        <Box sx={{width: '100%'}}>
            <ListView<CourseListItem>
                items={itemsWithId}
                icon={AutoStories}
                getTitle={(item) => item.course_name}
                columns={[
                    {
                        render: (item) => `${intl.formatMessage({
                            id: 'didactics.courses.code',
                            defaultMessage: 'Kod',
                        })}: ${item.course_code}`,
                        variant: 'secondary',
                        width: '120px',
                    },
                    {
                        render: (item) => `${intl.formatMessage({
                            id: 'didactics.courses.ects',
                            defaultMessage: 'ECTS',
                        })}: ${item.ects_points}`,
                        variant: 'secondary',
                        width: '100px',
                    },
                    {
                        render: (item) => item.course_language,
                        variant: 'secondary',
                    },
                ]}
                onMenuOpen={canUseCourseActions ? handleMenuOpen : undefined}
                onItemClick={canViewCourseInstructors ? handleItemClick : undefined}
                onAddClick={canCreateCourse ? handleAddClick : undefined}
                addLabel={intl.formatMessage({id: 'didactics.courses.add'})}
                emptyMessage={intl.formatMessage({id: 'didactics.courses.empty'})}
            />

            {canUseCourseActions && (
                <ActionMenu
                    anchorEl={anchorEl}
                    onClose={handleMenuClose}
                    onEdit={canUpdateCourse ? handleEditClick : undefined}
                    onDelete={canDeleteCourse ? handleDeleteClick : undefined}
                    editLabel={intl.formatMessage({id: 'didactics.common.edit'})}
                    deleteLabel={intl.formatMessage({id: 'didactics.common.delete'})}
                />
            )}

            {canDeleteCourse && (
                <DeleteConfirmDialog
                    open={isDeleteOpen}
                    title={intl.formatMessage({id: 'didactics.courses.deleteTitle'})}
                    description={intl.formatMessage(
                        {id: 'didactics.courses.deleteDesc'},
                        {name: selected?.course_name},
                    )}
                    cancelButtonLabel={intl.formatMessage({id: 'didactics.common.cancel'})}
                    confirmButtonLabel={intl.formatMessage({id: 'didactics.common.delete'})}
                    onConfirm={() => { void handleConfirmDelete(); }}
                    onClose={() => {
                        setIsDeleteOpen(false);
                    }}
                />
            )}

            {(canCreateCourse || canUpdateCourse) && (
                <CourseModal
                    open={isModalOpen}
                    course={selected}
                    unitId={unitId}
                    onClose={() => {
                        setIsModalOpen(false);
                    }}
                    onSuccess={onRefresh}
                />
            )}
        </Box>
    );
}