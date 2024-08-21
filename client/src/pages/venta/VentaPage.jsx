import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import {VentaList} from "../../components/venta";
import { checkAuth, checkRoles } from '../../utils/checkAuth';

function VentaPage() {
    useEffect(() => {
        checkAuth();
        checkRoles(['admin', 'cobranza']);
    }, []);

    return (
        <>
            <Typography
                variant="h4"
                sx={{
                    mt: 2,
                    fontFamily: 'roboto',
                    color: 'inherit'
                }}
            >
                Ventas
            </Typography>
            <VentaList onlyOrders={false}/>
        </>
    )
}

export default VentaPage;