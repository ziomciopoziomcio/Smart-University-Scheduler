import {useState} from 'react';
import {Box, Typography} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useIntl} from 'react-intl';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import {ListView} from '@components/Common';
import {type StudyProgram} from '@api';
import {StudyProgramModal} from "../Modals/StudyProgramModal";

interface ProgramListViewProps {
    data: StudyProgram[];
    facultyId: number;
    fieldId: number;
    onRefresh: () => void;
    fieldName: string;
}

export function ProgramListView({data, facultyId, fieldId, onRefresh, fieldName}: ProgramListViewProps) {
    const navigate = useNavigate();
    const intl = useIntl();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <Box>
            <ListView<StudyProgram>
                items={data}
                icon={FolderSpecialIcon}
                getTitle={(item) => item.program_name || `${fieldName} ${item.start_year}`}
                titleWidth="400px"
                columns={[
                    {
                        render: (item) => (
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                Nabór: {item.start_year}
                            </Typography>
                        ),
                        width: '150px'
                    },
                    {
                        render: (item) => intl.formatMessage(
                            {id: 'programs.list.semestersCount', defaultMessage: '{count} semestrów'},
                            {count: item.semesters_count ?? 0}
                        ),
                        variant: 'secondary',
                        width: '150px',
                        align: 'right'
                    }
                ]}
                onItemClick={(item) => {
                    navigate(`/programs/faculty/${facultyId}/field/${fieldId}/program/${item.id}`);
                }}
                onAddClick={() => setIsModalOpen(true)}
                addLabel={intl.formatMessage({id: 'programs.addProgram', defaultMessage: 'Dodaj rocznik'})}
                emptyMessage={intl.formatMessage({id: 'programs.noData'})}
                hideDividerOnLastItem
            />

            <StudyProgramModal
                open={isModalOpen}
                program={null}
                fieldId={fieldId}
                onClose={() => setIsModalOpen(false)}
                onSuccess={onRefresh}
            />
        </Box>
    );
}