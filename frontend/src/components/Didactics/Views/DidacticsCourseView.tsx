import {useState, useEffect} from 'react';
import {Box} from '@mui/material';
import {AutoStories} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {type Course, fetchCourses, deleteCourse} from '@api';
import CourseModal from '../Modals/CourseModal.tsx';

type CourseListItem = Course & { id: number };

interface DidacticsCourseViewProps {
    unitId: number;
}

export function DidacticsCourseView({unitId}: DidacticsCourseViewProps) {
    const intl = useIntl();

    const [data, setData] = useState<CourseListItem[]>([]);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selected, setSelected] = useState<CourseListItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const load = async () => {
        try {
            const res = await fetchCourses(100, 0, {leading_unit: unitId} as any);
            const rawItems = res?.items || (Array.isArray(res) ? res : []);

            const itemsWithId: CourseListItem[] = rawItems.map((item: Course) => ({
                ...item,
                id: item.course_code
            }));

            setData(itemsWithId);
        } catch {
            setData([]);
        }
    };

    useEffect(() => {
        void load();
    }, [unitId]);

    const handleConfirmDelete = async () => {
        if (selected) {
            await deleteCourse(selected.course_code);
            void load();
            setIsDeleteOpen(false);
        }
    };

    return (
        <Box sx={{width: '100%'}}>
            <ListView<CourseListItem>
                items={data}
                icon={AutoStories}
                getTitle={(item) => item.course_name}
                columns={[
                    {render: (item) => `Kod: ${item.course_code}`, variant: 'secondary', width: '120px'},
                    {render: (item) => `ECTS: ${item.ects_points}`, variant: 'secondary', width: '100px'},
                    {render: (item) => item.course_language, variant: 'secondary'}
                ]}
                onMenuOpen={(e, item) => {
                    setAnchorEl(e.currentTarget);
                    setSelected(item);
                }}
                onAddClick={() => {
                    setSelected(null);
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({id: 'didactics.courses.add'})}
                emptyMessage={intl.formatMessage({id: 'didactics.courses.empty'})}
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
                title={intl.formatMessage({id: 'didactics.courses.deleteTitle'})}
                description={intl.formatMessage({id: 'didactics.courses.deleteDesc'}, {name: selected?.course_name})}
                cancelButtonLabel={intl.formatMessage({id: 'didactics.common.cancel'})}
                confirmButtonLabel={intl.formatMessage({id: 'didactics.common.delete'})}
                onConfirm={handleConfirmDelete}
                onClose={() => setIsDeleteOpen(false)}
            />

            <CourseModal
                open={isModalOpen}
                course={selected}
                unitId={unitId}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => void load()}
            />
        </Box>
    );
}