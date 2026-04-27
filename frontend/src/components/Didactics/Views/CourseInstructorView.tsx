import {useState, useEffect} from 'react';
import {Box} from '@mui/material';
import {AssignmentInd, School, Timer} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {
    type CourseInstructor, type Course,
    fetchCourseInstructors, deleteCourseInstructor, fetchFacultyInstructors, getCourse
} from '@api';
import {CourseInstructorModal} from '../Modals/CourseInstructorModal';

interface CourseInstructorsViewProps {
    courseCode: number;
    facultyId: number;
}

type InstructorListItem = CourseInstructor & { id: string; fullName: string };

export function CourseInstructorsView({courseCode, facultyId}: CourseInstructorsViewProps) {
    const intl = useIntl();

    const [data, setData] = useState<InstructorListItem[]>([]);
    const [course, setCourse] = useState<Course | null>(null);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selected, setSelected] = useState<InstructorListItem | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const loadData = async () => {
        try {
            const [instRes, empRes, courseRes] = await Promise.all([
                fetchCourseInstructors(courseCode),
                fetchFacultyInstructors(facultyId),
                getCourse(courseCode)
            ]);

            setCourse(courseRes);

            const mapped = (instRes.items || []).map((item: CourseInstructor) => {
                const emp = empRes.find(e => e.id === item.employee);
                return {
                    ...item,
                    id: `${item.employee}-${item.class_type}`,
                    fullName: emp ? `${emp.degree || ''} ${emp.name} ${emp.surname}`.trim() : `ID: ${item.employee}`
                };
            });
            setData(mapped);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        void loadData();
    }, [courseCode, facultyId]);

    return (
        <Box sx={{width: '100%'}}>
            <ListView<InstructorListItem>
                items={data}
                icon={AssignmentInd}
                getTitle={(item) => item.fullName}
                columns={[
                    {render: (item) => item.class_type, icon: School, variant: 'primary', width: '200px'},
                    {render: (item) => `${item.hours}h`, icon: Timer, variant: 'secondary', width: '120px'}
                ]}
                onMenuOpen={(e, item) => {
                    setAnchorEl(e.currentTarget);
                    setSelected(item);
                }}
                onAddClick={() => {
                    setSelected(null);
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({id: 'didactics.instructors.add'})}
                emptyMessage={intl.formatMessage({id: 'didactics.instructors.empty'})}
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
                title={intl.formatMessage({id: 'didactics.instructors.deleteTitle'})}
                description={intl.formatMessage({id: 'didactics.instructors.deleteDesc'})}
                onConfirm={async () => {
                    if (selected) await deleteCourseInstructor(selected.employee, courseCode, selected.class_type);
                    setIsDeleteOpen(false);
                    void loadData();
                }}
                onClose={() => setIsDeleteOpen(false)}
                cancelButtonLabel={intl.formatMessage({id: 'didactics.common.cancel'})}
                confirmButtonLabel={intl.formatMessage({id: 'didactics.common.delete'})}
            />

            <CourseInstructorModal
                open={isModalOpen}
                course={course}
                instructor={selected}
                facultyId={facultyId}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadData}
            />
        </Box>
    );
}