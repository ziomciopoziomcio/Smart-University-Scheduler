import {Box} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import ClassIcon from '@mui/icons-material/Class';
import ListView from '@components/Common/ListView.tsx';
import ListPagination from '@components/Common/ListPagination.tsx';
import {type StudyPlanSpecializationSummary} from '../../../mocks/studyPlanSpecializationsMock';

interface PlansStudentSpecializationViewProps {
    data: StudyPlanSpecializationSummary[]; facultyId: number; fieldOfStudyId: number; semesterId: number; page: number; pageSize: number; totalItems: number;
    onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void;
}

export default function PlansStudentSpecializationView({data, facultyId, fieldOfStudyId, semesterId, page, pageSize, totalItems, onPageChange, onPageSizeChange}: PlansStudentSpecializationViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();

    return (
        <Box>
            <ListView<StudyPlanSpecializationSummary>
                items={data}
                icon={ClassIcon}
                getTitle={(item) => item.name}
                titleWidth="400px"
                columns={[
                    { render: (item) => `${item.groups_count} ${intl.formatMessage({id: 'plans.studentsPlan.studyGroup.groups', defaultMessage: 'Grup'})}`, variant: 'secondary', width: '150px' }
                ]}
                onItemClick={(item) => navigate(`/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/specialization/${item.id}/group`)}
                emptyMessage={intl.formatMessage({id: 'plans.studentsPlan.studySpecialization.noSpecializations', defaultMessage: 'Brak specjalizacji'})}
                hideDividerOnLastItem
            />
            {totalItems > 0 && <ListPagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} pageSizeOptions={[10, 20, 50]}/>}
        </Box>
    );
}