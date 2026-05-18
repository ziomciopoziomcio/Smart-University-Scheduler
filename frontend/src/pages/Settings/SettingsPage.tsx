import {useState} from 'react';
import {Box} from '@mui/material';
import {useIntl} from 'react-intl';
import {PageBreadcrumbs, type BreadcrumbItem, SearchBar} from '@components/Common';
import {SettingsSecurityView} from '@components/Settings';

export default function SettingsPage() {
    const intl = useIntl();
    const [search, setSearch] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            label: intl.formatMessage({id: 'settings.title'}),
            path: '/settings'
        }
    ];

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <SearchBar
                placeholder={intl.formatMessage({id: 'settings.searchPlaceholder'})}
                value={search}
                onChange={setSearch}
            />

            <PageBreadcrumbs items={breadcrumbs}/>

            <Box sx={{
                flexGrow: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
            }}>
                <SettingsSecurityView search={search} />
            </Box>
        </Box>
    );
}
