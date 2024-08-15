import { Typography } from '@mui/material';

export default function Unauthorized() {
    return (
        <Typography
            variant="h4"
            sx={{
                mt: 2,
                mb: 2,
                fontFamily: 'roboto',
                color: 'inherit'
            }}
        >
            Unauthorized access
        </Typography>
    )
}
