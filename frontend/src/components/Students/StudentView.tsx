import {useState} from 'react';
import {Box, Typography, alpha} from '@mui/material';
import {
    Email,
    Book,
    ClassOutlined as ClassOutlinedIcon,
    ExtensionOutlined as ExtensionOutlinedIcon,
    AutoStories as AutoStoriesIcon
} from '@mui/icons-material';
import {useIntl} from 'react-intl';

import {ListView, ActionMenu, DeleteConfirmDialog, UserAvatar} from '@components/Common';
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
                getTitle={() => ''}
                titleWidth={0}
                titleSx={{minWidth: 0, width: 0, p: 0}}
                rowSx={{px: 1, minHeight: 58}}
                columns={[
                    {
                        render: (item: Student) => <UserAvatar name={item.user.name} surname={item.user.surname}/>
                    },
                    {
                        render: (item: Student) => `${item.user.name} ${item.user.surname}`,
                        variant: 'primary',
                        width: '220px'
                    },
                    {
                        render: (item: Student) => item.user.email,
                        icon: Email,
                        variant: 'secondary',
                        width: '320px'
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
                    },
                    {
                        render: (item: Student) => {
                            const groups = item.groups || [];
                            return (
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    {groups.map((group) => {
                                        let Icon = AutoStoriesIcon;
                                        let color = 'text.secondary';
                                        let bgColor = (theme: any) => alpha(theme.palette.text.primary, 0.05);
                                        let bgHoverColor = (theme: any) => alpha(theme.palette.text.primary, 0.1);
                                        let iconOpacity = 0.6;
                                        
                                        if (group.major) {
                                            Icon = ClassOutlinedIcon;
                                            color = 'primary.main';
                                            bgColor = (theme: any) => alpha(theme.palette.primary.main, 0.08);
                                            bgHoverColor = (theme: any) => alpha(theme.palette.primary.main, 0.16);
                                            iconOpacity = 0.8;
                                        } else if (group.elective_block) {
                                            Icon = ExtensionOutlinedIcon;
                                            color = 'secondary.main';
                                            bgColor = (theme: any) => alpha(theme.palette.secondary.main, 0.08);
                                            bgHoverColor = (theme: any) => alpha(theme.palette.secondary.main, 0.16);
                                            iconOpacity = 0.8;
                                        }
                                        
                                        return (
                                            <Box
                                                key={group.id}
                                                sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    height: 32,
                                                    borderRadius: 16,
                                                    bgcolor: bgColor,
                                                    color: color,
                                                    overflow: 'hidden',
                                                    cursor: 'default',
                                                    minWidth: 32,
                                                    maxWidth: 32,
                                                    justifyContent: 'center',
                                                    boxSizing: 'border-box',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    '&:hover': {
                                                        maxWidth: 240,
                                                        paddingLeft: '8px',
                                                        paddingRight: '12px',
                                                        justifyContent: 'flex-start',
                                                        bgcolor: bgHoverColor,
                                                        '& .group-pill-text': {
                                                            opacity: 1,
                                                            maxWidth: 180,
                                                            marginLeft: '8px',
                                                        }
                                                    },
                                                }}
                                            >
                                                <Icon sx={{ fontSize: 18, flexShrink: 0, opacity: iconOpacity }} />
                                                <Typography
                                                    className="group-pill-text"
                                                    variant="caption"
                                                    sx={{
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        opacity: 0,
                                                        maxWidth: 0,
                                                        marginLeft: 0,
                                                        color: color,
                                                        transition: 'opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.3s ease',
                                                    }}
                                                >
                                                    {group.group_name}
                                                </Typography>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            );
                        },
                        width: '240px'
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