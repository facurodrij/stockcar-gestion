import React from 'react';
import Typography from "@mui/material/Typography";

export default function PageTitle({ heading }) {
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
            {heading}
        </Typography>
    );
};