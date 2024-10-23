import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import { checkAuth, checkPermissions } from '../../utils/checkAuth';
import List from '../../components/shared/List';
import { API } from '../../App';

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

    const columns = [
        { field: 'stock_actual', headerName: 'Stock', flex: 0.5 },
        { field: 'descripcion', headerName: 'Descripción', flex: 2 },
        { field: 'codigo_principal', headerName: 'Código principal', flex: 1 },
        { field: 'codigo_secundario', headerName: 'Código secundario', flex: 1 },
        { field: 'codigo_terciario', headerName: 'Código terciario', flex: 0.75 },
        { field: 'codigo_cuaternario', headerName: 'Código cuaternario', flex: 0.75 },
        { field: 'codigo_adicional', headerName: 'Código adicional', flex: 0.75 },
    ];

    const mapDataToRows = (data) => {
        return data['articulos'].map(item => ({
            id: item.id,
            stock_actual: item.stock_actual,
            codigo_principal: item.codigo_principal,
            codigo_secundario: item.codigo_secundario,
            codigo_terciario: item.codigo_terciario,
            codigo_cuaternario: item.codigo_cuaternario,
            codigo_adicional: item.codigo_adicional,
            descripcion: item.descripcion,
        }));
    };

    const snackbarMessages = {
        fetchError: (error) => `Error al obtener los artículos: ${error}`,
        deleteSuccess: (message) => message,
        deleteError: (error) => `Error al eliminar el artículo: ${error}`,
        actionCancelled: 'Acción cancelada'
    };

    const toolbarProps = {
        show_btn_add: allowCreate,
        txt_btn_add: 'Nuevo Artículo',
        url_btn_add: '/articulos/form'
    };

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
            <List
                apiUrl={`${API}/articulos`}
                editUrl='/articulos/form'
                detailUrl='/articulos'
                allowView={allowView}
                allowCreate={allowCreate}
                allowUpdate={allowUpdate}
                allowDelete={allowDelete}
                columns={columns}
                mapDataToRows={mapDataToRows}
                toolbarProps={toolbarProps}
                snackbarMessages={snackbarMessages}
            />
        </>
    )
}