import {Box, Typography} from '@mui/material';
import {type Role} from '@api';

interface RoleUsersViewProps {
    role: Role;
}

export default function RoleUsersView({role}: RoleUsersViewProps) {

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <Typography>
                {/*TODO: users list (is issued)*/}
                {role.role_name + " (TODO)"}
            </Typography>
        </Box>
    );
}