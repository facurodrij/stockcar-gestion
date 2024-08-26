import React, {useEffect} from 'react';
import {useParams} from 'react-router-dom';
import {ArticuloForm} from "../../components/articulo";
import Typography from "@mui/material/Typography";
import {checkAuth, checkPermissions} from '../../utils/checkAuth';

export default function ArticuloFormPage() {
    const routeParams = useParams();
    const pk = routeParams.pk;

    useEffect(() => {
        checkAuth();
        if (!checkPermissions(['articulo.create', 'articulo.update'])) {
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
                {pk ? 'Editar' : 'Agregar'} Artículo
            </Typography>
            <ArticuloForm pk={pk}/>
        </>
    );
};