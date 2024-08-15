import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Typography from "@mui/material/Typography";
import { VentaForm } from "../../components/venta";
import { checkAuth } from '../../utils/checkAuth';

export default function VentaFormPage() {
    const routeParams = useParams();
    const pk = routeParams.pk;

    useEffect(() => {
        checkAuth();
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
