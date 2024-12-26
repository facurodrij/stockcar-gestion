import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import { API } from '../../App';
import ArticuloList from '../../components/articulo/ArticuloList';
import { checkAuth, checkPermissions } from '../../utils/checkAuth';

export default function ArticuloPage() {
    useEffect(() => {
        checkAuth();
        if (!checkPermissions(['articulo.view_all'])) {
            window.location.href = '/unauthorized';
        }
    }, []);

    const allowView = checkPermissions(['articulo.view']);
    const allowCreate = checkPermissions(['articulo.create']);
    const allowUpdate = checkPermissions(['articulo.update']);
    const allowDelete = checkPermissions(['articulo.delete']);

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
                apiUrl={`${API}/articulos`}
                editUrl='/articulos/form'
                detailUrl='/articulos'
                allowView={allowView}
                allowCreate={allowCreate}
                allowUpdate={allowUpdate}
                allowDelete={allowDelete}
            />
        </>
    )
}