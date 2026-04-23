import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import {ListView, ListPagination} from '@components/Common';
import {type Unit} from '@api';
import {Groups} from "@mui/icons-material";

interface ScheduleEmployeeUnitViewProps {
    data: Unit[];
    facultyId: number;
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export function ScheduleEmployeeUnitView({
                                          data,
                                          facultyId,
                                          page,
                                          pageSize,
                                          totalItems,
                                          onPageChange,
                                          onPageSizeChange
                                      }: ScheduleEmployeeUnitViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();
    return (
        <Box>
            <ListView<Unit>
                items={data}
                icon={Groups}
                getTitle={(item) => item.unit_name}
                titleWidth="350px"
                columns={[{render: (item) => item.unit_short, variant: 'secondary', width: '100px'}]}
                onItemClick={(item) => navigate(`/schedules/lecturers/faculty/${facultyId}/unit/${item.id}/lecturer`)}
                emptyMessage={intl.formatMessage({id: 'facilities.common.noData'})}
                hideDividerOnLastItem
            />
            {totalItems > 0 &&
                <ListPagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={onPageChange}
                                onPageSizeChange={onPageSizeChange} pageSizeOptions={[10, 20, 50]}/>}
        </Box>
    );
}