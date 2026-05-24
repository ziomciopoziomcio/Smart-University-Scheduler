import {useState} from 'react';
import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';

import {ListView} from '@components/Common';
import {type StudyProgram} from '@api';
import {StudyProgramModal} from '../Modals/StudyProgramModal';
import {usePermissionStore} from '@store/usePermissionStore';
import {PERMISSIONS} from '@constants/permissions';

interface ProgramListViewProps {
    data: StudyProgram[];
    facultyId: number;
    fieldId: number;
    onRefresh: () => void;
    fieldName: string;
    basePath?: string;
}

export function ProgramListView({
    data,
    facultyId,
    fieldId,
    onRefresh,
    fieldName,
    basePath = '/programs',
}: ProgramListViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    const canCreateStudyProgram = hasAnyPermission([
        PERMISSIONS.STUDY_PROGRAM_CREATE,
    ]);

    const canViewCurriculum = hasAnyPermission([
        PERMISSIONS.CURRICULUMS_VIEW,
        PERMISSIONS.CURRICULUM_VIEW,
    ]);

    const canViewGroups = hasAnyPermission([
        PERMISSIONS.GROUPS_VIEW,
        PERMISSIONS.GROUP_VIEW,
    ]);

    const canOpenStudyProgram = canViewCurriculum || canViewGroups;

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAddClick = () => {
        if (!canCreateStudyProgram) {
            return;
        }

        setIsModalOpen(true);
    };

    const handleItemClick = (item: StudyProgram) => {
        if (!canOpenStudyProgram) {
            return;
        }

        navigate(`${basePath}/${facultyId}/field/${fieldId}/program/${item.id}`);
    };

    return (
        <Box>
            <ListView<StudyProgram>
                items={data}
                icon={FolderSpecialIcon}
                getTitle={(item) => item.program_name || `${fieldName} ${item.start_year}`}
                titleWidth="400px"
                columns={[
                    {
                        render: (item) => intl.formatMessage(
                            {id: 'didactics.programs.list.recruitment'},
                            {year: item.start_year},
                        ),
                        width: '150px',
                    },
                    {
                        render: (item) => intl.formatMessage(
                            {id: 'didactics.programs.list.semestersCount'},
                            {count: item.semesters_count ?? 0},
                        ),
                        variant: 'secondary',
                        width: '150px',
                        align: 'right',
                    },
                ]}
                onItemClick={canOpenStudyProgram ? handleItemClick : undefined}
                onAddClick={canCreateStudyProgram ? handleAddClick : undefined}
                addLabel={intl.formatMessage({id: 'didactics.programs.addProgram'})}
                emptyMessage={intl.formatMessage({id: 'didactics.programs.noData'})}
                hideDividerOnLastItem
            />

            {canCreateStudyProgram && (
                <StudyProgramModal
                    open={isModalOpen}
                    program={null}
                    fieldId={fieldId}
                    onClose={() => {
                        setIsModalOpen(false);
                    }}
                    onSuccess={onRefresh}
                />
            )}
        </Box>
    );
}