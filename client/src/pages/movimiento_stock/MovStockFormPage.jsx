import React, { useEffect } from 'react';
import Typography from "@mui/material/Typography";
import MovStockForm from '../../components/movimiento_stock/MovStockForm';
import { checkAuth, checkPermissions } from '../../utils/checkAuth';

export default function MovStockFormPage() {
    useEffect(() => {
        checkAuth();
        if (!checkPermissions(['movimiento_stock.create'])) {
            window.location.href = '/unauthorized';
        }
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
                Agregar Movimiento de Stock
            </Typography>
            <MovStockForm />
        </>
    );
};
