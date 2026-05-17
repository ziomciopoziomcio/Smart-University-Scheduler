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
    basePath?: string;
}

export function ProgramListView({data, facultyId, fieldId, onRefresh, fieldName, basePath = '/programs'}: ProgramListViewProps) {
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
                        render: (item) => intl.formatMessage({id: 'didactics.programs.list.recruitment'}, {year: item.start_year}),
                        width: '150px'
                    },
                    {
                        render: (item) => intl.formatMessage(
                            {id: 'didactics.programs.list.semestersCount'},
                            {count: item.semesters_count ?? 0}
                        ),
                        variant: 'secondary',
                        width: '150px',
                        align: 'right'
                    }
                ]}
                onItemClick={(item) => {
                    navigate(`${basePath}/${facultyId}/field/${fieldId}/program/${item.id}`);
                }}
                onAddClick={() => {
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({id: 'didactics.programs.addProgram'})}
                emptyMessage={intl.formatMessage({id: 'didactics.programs.noData'})}
                hideDividerOnLastItem
            />

            <StudyProgramModal
                open={isModalOpen}
                program={null}
                fieldId={fieldId}
                onClose={() => {
                    setIsModalOpen(false);
                }} onSuccess={onRefresh}
            />
        </Box>
    );
}