import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Typography from "@mui/material/Typography";
import { VentaForm } from "../../components/venta";
import { checkAuth, checkPermissions } from '../../utils/checkAuth';

export default function VentaFormPage() {
    const routeParams = useParams();
    const location = useLocation();
    const pk = routeParams.pk;

    const queryParams = new URLSearchParams(location.search);
    const itemsByVentaId = queryParams.get('itemsByVentaId');

    useEffect(() => {
        checkAuth();
        if (!checkPermissions(['venta.create', 'venta.update'])) {
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
                {pk ? 'Editar' : 'Agregar'} Venta
            </Typography>
            <VentaForm pk={pk} itemsByVentaId={itemsByVentaId} />
        </>
    );
};
