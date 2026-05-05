import {useState} from "react";
import {Box, Chip, Typography} from '@mui/material';
import {useIntl} from 'react-intl';
import BookIcon from '@mui/icons-material/Book';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import {ListView} from '@components/Common';
import {type CurriculumCourse} from '@api';
import {CurriculumModal} from '../Modals/CurriculumModal';

interface ProgramCurriculumViewProps {
    data: CurriculumCourse[];
    programId: number;
    semesterId: number;
    fieldId: number;
    onRefresh: () => void;
}

export function ProgramCurriculumView({data, programId, semesterId, fieldId, onRefresh}: ProgramCurriculumViewProps) {
    const intl = useIntl();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const mappedData = data.map(item => ({
        ...item,
        id: `${item.study_program}-${item.course}-${item.semester}`
    }));

    return (
        <Box>
            <ListView<CurriculumCourse & { id: string }>
                items={mappedData}
                icon={BookIcon}
                getTitle={(item) => item.course_details?.course_name || `ID Przedmiotu: ${item.course}`}
                titleWidth="400px"
                columns={[
                    {
                        render: (item) => (
                            <Typography variant="body2" fontWeight={600} display="flex" alignItems="center" gap={0.5}>
                                <StarOutlineIcon fontSize="small" sx={{color: '#f59e0b'}}/>
                                {item.course_details?.ects_points ?? 0} ECTS
                            </Typography>
                        ),
                        width: '120px'
                    },
                    {
                        render: (item) => item.major ? (
                            <Chip
                                size="small"
                                label={item.major_details?.major_name || `Spec. ID: ${item.major}`}
                                color="primary"
                                variant="outlined"
                            />
                        ) : '—',
                        width: '200px'
                    },
                    {
                        render: (item) => item.elective_block ? (
                            <Chip
                                size="small"
                                label={item.elective_block_details?.elective_block_name || `Blok ID: ${item.elective_block}`}
                                color="secondary"
                                variant="outlined"
                            />
                        ) : '—',
                        width: '200px'
                    }
                ]}
                onAddClick={() => setIsModalOpen(true)}
                addLabel={intl.formatMessage({id: 'programs.addCourse', defaultMessage: 'Dodaj przedmiot'})}
                emptyMessage={intl.formatMessage({id: 'programs.noData'})}
                hideDividerOnLastItem
            />

            <CurriculumModal
                open={isModalOpen}
                programId={programId}
                semesterId={semesterId}
                fieldId={fieldId}
                onClose={() => setIsModalOpen(false)}
                onSuccess={onRefresh}
            />
        </Box>
    );
}