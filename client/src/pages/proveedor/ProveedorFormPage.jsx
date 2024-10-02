import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Typography from "@mui/material/Typography";
import { ProveedorForm } from '../../components/proveedor';
import { checkAuth, checkPermissions } from '../../utils/checkAuth';

export default function ProveedorFormPage() {
    const routeParams = useParams();
    const pk = routeParams.pk;

    useEffect(() => {
        checkAuth();
        if (!checkPermissions(['proveedor.create', 'proveedor.update'])) {
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
                {pk ? 'Editar' : 'Agregar'} Proveedor
            </Typography>
            <ProveedorForm pk={pk} />
        </>
    );
};
