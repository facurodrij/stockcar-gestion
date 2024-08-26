import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Typography from "@mui/material/Typography";
import { ClienteForm } from '../../components/cliente';
import { checkAuth, checkPermissions } from '../../utils/checkAuth';

export default function ClienteFormPage() {
    const routeParams = useParams();
    const pk = routeParams.pk;

    useEffect(() => {
        checkAuth();
        checkPermissions(['cliente.create', 'cliente.update']);
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
                {pk ? 'Editar' : 'Agregar'} Cliente
            </Typography>
            <ClienteForm pk={pk} />
        </>
    );
};
