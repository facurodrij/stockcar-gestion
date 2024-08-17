import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import {VentaList} from "../../components/venta";
import { checkAuth } from '../../utils/checkAuth';

export default function OrdenVentaPage() {
    useEffect(() => {
        checkAuth();
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
                Ordenes de Venta
            </Typography>
            <VentaList onlyOrders={true}/>
        </>
    )
}
