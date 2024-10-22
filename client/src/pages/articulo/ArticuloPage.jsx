import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import { ArticuloList } from "../../components/articulo";
import { checkAuth, checkPermissions } from '../../utils/checkAuth';

export default function ArticuloPage() {
    useEffect(() => {
        checkAuth();
        if (!checkPermissions(['articulo.view_all'])) {
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
                Artículos
            </Typography>
            <ArticuloList
                allowView={checkPermissions(['articulo.view'])}
                allowCreate={checkPermissions(['articulo.create'])}
                allowUpdate={checkPermissions(['articulo.update'])}
                allowDelete={checkPermissions(['articulo.delete'])}
            />
        </>
    )
}