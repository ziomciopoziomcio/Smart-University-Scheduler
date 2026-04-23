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

    const itemsWithId: SemesterWithId[] = data.map(item => ({
        ...item,
        id: item.semester_number
    }));

    return (
        <Box>
            <ListView<SemesterWithId>
                items={itemsWithId}
                icon={DateRangeIcon}
                getTitle={(item) => `${intl.formatMessage({
                    id: 'plans.studentsPlan.studySemester.semester',
                    defaultMessage: 'Semestr'
                })} ${item.semester_number}`}
                titleWidth="250px"
                columns={[
                    {
                        render: (item) => `${item.groups_count} ${intl.formatMessage({
                            id: 'plans.studentsPlan.studyGroup.groups',
                            defaultMessage: 'Grup'
                        })}`, variant: 'secondary', width: '150px'
                    }
                ]}
                onItemClick={(item) => {
                    const nextStep = item.specializations_count ? 'specialization' : 'group';
                    navigate(`/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${item.semester_number}/${nextStep}`);
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