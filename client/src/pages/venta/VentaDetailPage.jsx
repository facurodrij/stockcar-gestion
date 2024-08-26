import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Typography from "@mui/material/Typography";
import { VentaDetail } from "../../components/venta";
import { checkAuth, checkPermissions } from '../../utils/checkAuth';

export default function VentaDetailPage() {
    const routeParams = useParams();
    const pk = routeParams.pk;

    useEffect(() => {
        checkAuth();
        if (!checkPermissions(['venta.view'])) {
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
                Detalle de Venta
            </Typography>
            <VentaDetail pk={pk} />
        </>
    );
};
