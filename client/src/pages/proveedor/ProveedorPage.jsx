import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import { checkAuth, checkPermissions } from '../../utils/checkAuth';
import List from '../../components/shared/List';
import { API } from '../../App';


export default function ProveedorPage() {
    useEffect(() => {
        checkAuth();
        if (!checkPermissions(['proveedor.view_all'])) {
            window.location.href = '/unauthorized';
        }
    }, []);

    const allowView = false;
    const allowCreate = checkPermissions(['proveedor.create']);
    const allowUpdate = checkPermissions(['proveedor.update']);
    const allowDelete = false;

    const columns = [
        { field: 'tipo_responsable', headerName: 'Tipo responsable', flex: 1 },
        { field: 'razon_social', headerName: 'Razón social', flex: 1.5 },
        { field: 'tipo_documento', headerName: 'Tipo documento', flex: 1 },
        { field: 'nro_documento', headerName: 'Nro. documento', flex: 1 },
        { field: 'direccion', headerName: 'Dirección', flex: 1 },
        { field: 'localidad', headerName: 'Localidad', flex: 1 }
    ];

    const mapDataToRows = (data) => {
        return data['proveedores'].map(item => ({
            id: item.id,
            tipo_responsable: item.tipo_responsable['descripcion'] || '',
            razon_social: item.razon_social,
            tipo_documento: item.tipo_documento['descripcion'] || '',
            nro_documento: item.nro_documento,
            direccion: item.direccion,
            localidad: item.localidad
        }));
    };

    const snackbarMessages = {
        fetchError: (error) => `Error al obtener los proveedores: ${error}`,
        deleteSuccess: (message) => message,
        deleteError: (error) => `Error al eliminar el proveedor: ${error}`,
        actionCancelled: 'Acción cancelada'
    };

    const toolbarProps = {
        show_btn_add: allowCreate,
        txt_btn_add: 'Nuevo Proveedor',
        url_btn_add: '/proveedores/form'
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
                Proveedores
            </Typography>
            <List
                apiUrl={`${API}/proveedores`}
                editUrl='/proveedores/form'
                detailUrl='/proveedores'
                allowView={allowView}
                allowUpdate={allowUpdate}
                allowDelete={allowDelete}
                columns={columns}
                mapDataToRows={mapDataToRows}
                snackbarMessages={snackbarMessages}
                toolbarProps={toolbarProps}
            />
        </>
    )
}
