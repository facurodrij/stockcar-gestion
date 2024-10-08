import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Typography from "@mui/material/Typography";
import { VentaForm } from "../../components/venta";
import { checkAuth, checkPermissions } from '../../utils/checkAuth';

export default function VentaFormPage() {
    const routeParams = useParams();
    const pk = routeParams.pk;

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
            <VentaForm pk={pk} />
        </>
    );
};
