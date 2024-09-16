import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Typography from "@mui/material/Typography";
import { ArticuloDetail } from "../../components/articulo";
import { checkAuth, checkPermissions } from '../../utils/checkAuth';

export default function ArticuloDetailPage() {
    const routeParams = useParams();
    const pk = routeParams.pk;

    useEffect(() => {
        checkAuth();
        if (!checkPermissions(['articulo.view'])) {
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
                Detalle de Artículo
            </Typography>
            <ArticuloDetail pk={pk} />
        </>
    );
};
