import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Typography from "@mui/material/Typography";
import MovStockForm from '../../components/movimiento_stock/MovStockForm';
import { checkAuth, checkPermissions } from '../../utils/checkAuth';

export default function MovStockFormPage() {
    const routeParams = useParams();
    const pk = routeParams.pk;

    useEffect(() => {
        checkAuth();
        if (!checkPermissions(['movimiento_stock.create', 'movimiento_stock.update'])) {
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
                {pk ? 'Editar' : 'Agregar'} Movimiento de Stock
            </Typography>
            <MovStockForm pk={pk} />
        </>
    );
};
