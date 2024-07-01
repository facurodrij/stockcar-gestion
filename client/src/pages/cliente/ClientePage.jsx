import React from 'react';
import Typography from '@mui/material/Typography';
import {ClienteList} from "../../components/cliente";


export default function ClientePage() {
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
                Clientes
            </Typography>
            <ClienteList/>
        </>
    )
}
