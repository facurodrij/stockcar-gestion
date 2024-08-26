import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import {ClienteList} from "../../components/cliente";
import { checkAuth, checkPermissions } from '../../utils/checkAuth';


export default function ClientePage() {
    useEffect(() => {
        checkAuth();
        checkPermissions('cliente.view_all');
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
