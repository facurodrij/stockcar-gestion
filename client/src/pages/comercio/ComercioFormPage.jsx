import React, { useEffect } from 'react';
import {useParams} from 'react-router-dom';
import Typography from "@mui/material/Typography";
import {ComercioForm} from '../../components/comercio';
import { checkAuth, checkPermissions } from '../../utils/checkAuth';

export default function ComercioFormPage() {
    const routeParams = useParams();
    const pk = routeParams.pk;

    useEffect(() => {
        checkAuth();
        if (!checkPermissions(['comercio.create', 'comercio.update'])) {
            window.location.href = '/unauthorized';
        }
    } , []);

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
                {pk ? 'Editar' : 'Agregar'} Comercio
            </Typography>
            <ComercioForm pk={pk}/>
        </>
    );
};
