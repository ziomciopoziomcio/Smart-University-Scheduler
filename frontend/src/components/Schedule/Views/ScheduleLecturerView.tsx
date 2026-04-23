import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import ListView from '@components/Common/ListView.tsx';
import ListPagination from '@components/Common/ListPagination.tsx';
import {type CourseInstructor} from '@api';
import UserAvatar from "@components/Common/UserAvatar.tsx";

interface PlansLecturerViewProps {
    data: CourseInstructor[];
    facultyId: number;
    unitId: number;
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export default function PlansLecturerView({
                                              data,
                                              facultyId,
                                              unitId,
                                              page,
                                              pageSize,
                                              totalItems,
                                              onPageChange,
                                              onPageSizeChange
                                          }: PlansLecturerViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    return (
        <Box>
            <ListView<CourseInstructor>
                items={data}
                getTitle={() => ''}
                titleWidth={0}
                columns={[
                    {
                        render: (item) => <UserAvatar name={item.name} surname={item.surname}/>
                    },
                    {
                        render: (item) => `${item.name || ''} ${item.surname || ''}`.trim() || '—',
                        variant: 'primary',
                        width: 320
                    },
                    {
                        render: (item) => item.degree ?? '—',
                        variant: 'secondary',
                        width: 140
                    },
                ]}
                onItemClick={(item) => navigate(`/plans/lecturers/faculty/${facultyId}/unit/${unitId}/lecturer/${item.id}`)}
                emptyMessage={intl.formatMessage({id: 'facilities.common.noData'})}
                hideDividerOnLastItem rowSx={{px: 1, minHeight: 58}} titleSx={{minWidth: 0, width: 0, p: 0}}
            />
            {totalItems > 0 &&
                <ListPagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={onPageChange}
                                onPageSizeChange={onPageSizeChange} pageSizeOptions={[10, 20, 50]}/>
            }
        </Box>
    );
}