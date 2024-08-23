import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import {ClienteList} from "../../components/cliente";
import { checkAuth, checkRoles } from '../../utils/checkAuth';


export default function ClientePage() {
    useEffect(() => {
        checkAuth();
        checkRoles(['admin', 'cobranza', 'vendedor']);
    }, []);

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
