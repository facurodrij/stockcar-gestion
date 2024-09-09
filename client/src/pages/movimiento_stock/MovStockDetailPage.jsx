import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Typography from "@mui/material/Typography";
import { MovStockDetail } from '../../components/movimiento_stock';
import { checkAuth, checkPermissions } from '../../utils/checkAuth';

export default function MovStockDetailPage() {
    const routeParams = useParams();
    const pk = routeParams.pk;

    useEffect(() => {
        checkAuth();
        if (!checkPermissions(['movimiento_stock.view'])) {
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
                Detalle de Movimiento de Stock
            </Typography>
            <MovStockDetail pk={pk} />
        </>
    );
};
