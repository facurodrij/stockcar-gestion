import React from 'react';
import Typography from '@mui/material/Typography';
import {ComercioList} from "../../components/comercio";


export default function ComercioPage() {
    return (
        <>
            <Typography
                variant="h4"
                sx={{
                    mt: 2,
                    mb: 2,
                    fontFamily: 'roboto',
                    color: 'inherit'
                }}
            >
                Comercios
            </Typography>
            <ComercioList/>
        </>
    )
}
