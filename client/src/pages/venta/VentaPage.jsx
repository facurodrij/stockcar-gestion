import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import {VentaList} from "../../components/venta";
import { checkAuth, checkPermissions } from '../../utils/checkAuth';

export default function VentaPage() {
    useEffect(() => {
        checkAuth();
        if (!checkPermissions(['venta.view_all'])) {
            window.location.href = '/unauthorized';
        }
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
