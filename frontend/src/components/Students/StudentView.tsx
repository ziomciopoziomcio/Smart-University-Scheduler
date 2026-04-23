import {useState} from 'react';
import {Box} from '@mui/material';
import {School, Email, Book} from '@mui/icons-material';
import {useIntl} from 'react-intl';

import {ListView, ActionMenu, DeleteConfirmDialog} from '@components/Common';
import {type Student, deleteStudent} from '@api';
import StudentModal from "./StudentModal.tsx";

interface StudentViewProps {
    data: Student[];
    onRefresh: () => void;
}

export default function StudentView({data, onRefresh}: StudentViewProps) {
    const intl = useIntl();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, item: Student) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedStudent(item);
    };

    const handleConfirmDelete = async () => {
        if (!selectedStudent) return;
        try {
            await deleteStudent(selectedStudent.id);
            onRefresh();
            setIsDeleteModalOpen(false);
        } catch {
            alert(intl.formatMessage({id: 'academics.students.errors.delete'}));
        }
    };

    return (
        <Box>
            <ListView
                items={data}
                icon={School}
                getTitle={(item: Student) => `${item.user.name} ${item.user.surname}`}
                titleWidth="250px"
                columns={[
                    {
                        render: (item: Student) => item.user.email,
                        icon: Email,
                        variant: 'secondary',
                        width: '250px'
                    },
                    {
                        render: (item: Student) => {
                            let text = item.study_program_details.program_name;
                            if (item.major_details) {
                                text += ` (${item.major_details.major_name})`;
                            }
                            return text;
                        },
                        icon: Book,
                        variant: 'primary',
                        width: '350px'
                    }
                ]}
                onMenuOpen={handleMenuOpen}
                onAddClick={() => {
                    setSelectedStudent(null);
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({id: 'academics.students.add'})}
                emptyMessage={intl.formatMessage({id: 'academics.students.empty'})}
            />

            <ActionMenu
                anchorEl={anchorEl}
                onClose={() => {
                    setAnchorEl(null);
                }}
                onEdit={() => {
                    setIsModalOpen(true);
                }}
                onDelete={() => {
                    setIsDeleteModalOpen(true);
                }}
                editLabel={intl.formatMessage({id: 'academics.students.edit'})}
                deleteLabel={intl.formatMessage({id: 'academics.students.delete'})}
            />

            <DeleteConfirmDialog
                open={isDeleteModalOpen}
                title={intl.formatMessage({id: 'academics.students.deleteTitle'})}
                description={intl.formatMessage(
                    {id: 'academics.students.deleteDesc'},
                    {name: `${selectedStudent?.user.name} ${selectedStudent?.user.surname}`}
                )}
                cancelButtonLabel={intl.formatMessage({id: 'academics.common.cancel'})}
                confirmButtonLabel={intl.formatMessage({id: 'academics.common.deleteConfirm'})}
                onConfirm={() => {
                    void handleConfirmDelete();
                }}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                }}
            />

            <StudentModal
                open={isModalOpen}
                student={selectedStudent}
                onClose={() => {
                    setIsModalOpen(false);
                }}
                onSuccess={onRefresh}
            />
        </Box>
    );
}