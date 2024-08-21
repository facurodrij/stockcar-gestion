import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Typography from "@mui/material/Typography";
import { UsuarioForm } from '../../components/usuario';
import { checkAuth, checkRoles } from '../../utils/checkAuth';

export default function UsuarioFormPage() {
    const routeParams = useParams();
    const pk = routeParams.pk;

    useEffect(() => {
        checkAuth();
        checkRoles(['admin']);
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
                {pk ? 'Editar' : 'Agregar'} Usuario
            </Typography>
            <UsuarioForm pk={pk} />
        </>
    );
};
