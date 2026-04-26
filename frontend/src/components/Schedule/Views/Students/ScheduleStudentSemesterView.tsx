import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import DateRangeIcon from '@mui/icons-material/DateRange';

import {ListPagination, ListView} from '@components/Common';
import {type StudyFieldSemesterSummary} from '@api';

interface ScheduleStudentSemesterViewProps {
    data: StudyFieldSemesterSummary[];
    facultyId: number;
    fieldOfStudyId: number;
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

type SemesterWithId = StudyFieldSemesterSummary & { id: number };

export function ScheduleStudentSemesterView({
                                                data,
                                                facultyId,
                                                fieldOfStudyId,
                                                page,
                                                pageSize,
                                                totalItems,
                                                onPageChange,
                                                onPageSizeChange
                                            }: ScheduleStudentSemesterViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    const itemsWithId: SemesterWithId[] = data.map((item) => ({
        ...item,
        id: item.semester_number
    }));

    const hasAnyElectiveBlocks = itemsWithId.some(
        (item) => (item.elective_blocks_count ?? 0) > 0
    );

    const getGroupsOrSpecializationsLabel = (item: SemesterWithId) => {
        const specializationsCount = item.specializations_count ?? 0;

        if (specializationsCount > 0) {
            return intl.formatMessage(
                {id: 'plans.studentsPlan.studySemester.specializationsCount'},
                {count: specializationsCount}
            );
        }

        return intl.formatMessage(
            {id: 'plans.studentsPlan.studySemester.groupsCount'},
            {count: item.groups_count ?? 0}
        );
    };

    const getElectiveBlocksLabel = (item: SemesterWithId) => {
        const electiveBlocksCount = item.elective_blocks_count ?? 0;

        if (electiveBlocksCount <= 0) {
            return '';
        }

        return intl.formatMessage(
            {id: 'plans.studentsPlan.studySemester.electiveBlocksCount'},
            {count: electiveBlocksCount}
        );
    };

    return (
        <Box>
            <ListView<SemesterWithId>
                items={itemsWithId}
                icon={DateRangeIcon}
                getTitle={(item) =>
                    intl.formatMessage(
                        {
                            id: 'plans.studentsPlan.studySemester.semesterLabel',
                            defaultMessage: 'Semestr {number}'
                        },
                        {number: item.semester_number}
                    )
                }
                titleWidth="250px"
                columns={[
                    {
                        render: getGroupsOrSpecializationsLabel,
                        variant: 'secondary',
                        width: '190px'
                    },
                    ...(hasAnyElectiveBlocks
                        ? [
                            {
                                render: getElectiveBlocksLabel,
                                variant: 'secondary' as const,
                                width: '190px'
                            }
                        ]
                        : [])
                ]}
                onItemClick={(item) => {
                    const hasSpecializations = (item.specializations_count ?? 0) > 0;
                    const nextStep = hasSpecializations ? 'major' : 'group';

                    navigate(
                        `/schedules/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${item.semester_number}/${nextStep}`
                    );
                }}
                emptyMessage={intl.formatMessage({
                    id: 'plans.studentsPlan.studySemester.noSemesters',
                    defaultMessage: 'Brak semestrów'
                })}
                hideDividerOnLastItem
            />

            {totalItems > 0 && (
                <ListPagination
                    page={page}
                    pageSize={pageSize}
                    totalItems={totalItems}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                    pageSizeOptions={[10, 20, 50]}
                />
            )}
        </Box>
    );
}