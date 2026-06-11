import {
    Box,
    FormControl,
    IconButton,
    MenuItem,
    Select,
    Typography,
} from '@mui/material';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import {useIntl} from 'react-intl';

interface ListPaginationProps {
    page: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    pageSizeOptions?: number[];
}

//TODO: Make it pretty
export default function ListPagination({
                                           page,
                                           totalItems,
                                           pageSize,
                                           onPageChange,
                                           onPageSizeChange,
                                           pageSizeOptions = [5, 10, 20, 50],
                                       }: ListPaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const intl = useIntl();

    const handlePrevPage = () => {
        onPageChange(Math.max(1, page - 1));
    };

    const handleNextPage = () => {
        onPageChange(Math.min(totalPages, page + 1));
    };

    return (
        <Box
            sx={{
                mt: 2,
                pt: 1,
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: {xs: 1.5, md: 2.5},
                flexWrap: 'wrap',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <Typography
                    sx={{
                        fontSize: '14px',
                        color: 'text.secondary',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {intl.formatMessage({id: 'table.rowsPerPage'})}
                </Typography>

                <FormControl size="small" variant="outlined">
                    <Select
                        value={pageSize}
                        onChange={(event) => onPageSizeChange(Number(event.target.value))}
                        IconComponent={KeyboardArrowDownRounded}
                        sx={{
                            minWidth: 74,
                            height: 34,
                            fontSize: '14px',
                            color: 'text.primary',
                            borderRadius: '10px',
                            bgcolor: 'background.default',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'divider',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'text.disabled',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                                borderWidth: '1px',
                            },
                            '& .MuiSelect-select': {
                                py: '7px',
                                pl: 1.5,
                                pr: 3.5,
                            },
                        }}
                    >
                        {pageSizeOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Typography
                sx={{
                    fontSize: '14px',
                    color: 'text.secondary',
                    minWidth: '42px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                }}
            >
                {page} {intl.formatMessage({id: 'table.of'})} {totalPages}
            </Typography>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.25,
                }}
            >
                <IconButton
                    size="small"
                    disabled={page === 1}
                    onClick={handlePrevPage}
                    sx={{
                        width: 30,
                        height: 30,
                        color: 'action.active',
                        borderRadius: '8px',
                        '&:hover': {
                            bgcolor: 'action.hover',
                        },
                        '&.Mui-disabled': {
                            color: 'action.disabled',
                        }
                    }}
                >
                    <ChevronLeftRounded fontSize="small"/>
                </IconButton>

                <IconButton
                    size="small"
                    disabled={page >= totalPages}
                    onClick={handleNextPage}
                    sx={{
                        width: 30,
                        height: 30,
                        color: 'action.active',
                        borderRadius: '8px',
                        '&:hover': {
                            bgcolor: 'action.hover',
                        },
                        '&.Mui-disabled': {
                            color: 'action.disabled',
                        }
                    }}
                >
                    <ChevronRightRounded fontSize="small"/>
                </IconButton>
            </Box>
        </Box>
    );
}