import {useState} from 'react';
import {Box} from '@mui/material';
import {AutoStories} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {useNavigate} from 'react-router-dom';

import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {type Course, deleteCourse} from '@api';
import CourseModal from '../Modals/CourseModal.tsx';

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

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selected, setSelected] = useState<CourseListItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const itemsWithId: CourseListItem[] = (data || []).map((item) => ({...item, id: item.course_code}));

    const handleConfirmDelete = async () => {
        if (selected) {
            await deleteCourse(selected.course_code);
            onRefresh();
            setIsDeleteOpen(false);
        }
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
                            defaultMessage: 'Kod'
                        })}: ${item.course_code}`, variant: 'secondary', width: '120px'
                    },
                    {
                        render: (item) => `${intl.formatMessage({
                            id: 'didactics.courses.ects',
                            defaultMessage: 'ECTS'
                        })}: ${item.ects_points}`, variant: 'secondary', width: '100px'
                    },
                    {render: (item) => item.course_language, variant: 'secondary'}
                ]}
                onMenuOpen={(e, item) => {
                    setAnchorEl(e.currentTarget);
                    setSelected(item);
                }}
                onItemClick={(item) => navigate(`/didactics/courses/faculty/${facultyId}/unit/${unitId}/course/${item.course_code}/instructors`)}
                onAddClick={() => {
                    setSelected(null);
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({id: 'didactics.courses.add'})}
                emptyMessage={intl.formatMessage({id: 'didactics.courses.empty'})}
            />

            <ActionMenu anchorEl={anchorEl} onClose={() => {
                setAnchorEl(null);
            }} onEdit={() => {
                setIsModalOpen(true);
                setAnchorEl(null);
            }} onDelete={() => {
                setIsDeleteOpen(true);
                setAnchorEl(null);
            }} editLabel={intl.formatMessage({id: 'didactics.common.edit'})}
                        deleteLabel={intl.formatMessage({id: 'didactics.common.delete'})}/>
            <DeleteConfirmDialog open={isDeleteOpen} title={intl.formatMessage({id: 'didactics.courses.deleteTitle'})}
                                 description={intl.formatMessage({id: 'didactics.courses.deleteDesc'}, {name: selected?.course_name})}
                                 cancelButtonLabel={intl.formatMessage({id: 'didactics.common.cancel'})}
                                 confirmButtonLabel={intl.formatMessage({id: 'didactics.common.delete'})}
                                 onConfirm={handleConfirmDelete} onClose={() => {
                setIsDeleteOpen(false);
            }}/>
            <CourseModal open={isModalOpen} course={selected} unitId={unitId} onClose={() => {
                setIsModalOpen(false);
            }}
                         onSuccess={onRefresh}/>
        </Box>
    );
}