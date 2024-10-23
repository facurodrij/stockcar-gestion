import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import { checkAuth, checkPermissions } from '../../utils/checkAuth';
import List from '../../components/shared/List';
import { API } from '../../App';


export default function ComercioPage() {
    useEffect(() => {
        checkAuth();
        if (!checkPermissions(['comercio.view_all'])) {
            window.location.href = '/unauthorized';
        }
    }, []);

    const allowView = false;
    const allowCreate = checkPermissions(['comercio.create']);
    const allowUpdate = checkPermissions(['comercio.update']);
    const allowDelete = false;

    const columns = [
        { field: 'tipo_responsable', headerName: 'Tipo responsable', flex: 1.5 },
        { field: 'razon_social', headerName: 'Razón social', flex: 1.5 },
        { field: 'cuit', headerName: 'CUIT', flex: 1 },
        { field: 'direccion', headerName: 'Dirección', flex: 1 },
        { field: 'localidad', headerName: 'Localidad', flex: 0.5 },
    ];

    const mapDataToRows = (data) => {
        return data['comercios'].map(item => ({
            id: item.id,
            tipo_responsable: item.tipo_responsable['descripcion'] || '',
            razon_social: item.razon_social,
            cuit: item.cuit,
            direccion: item.direccion,
            localidad: item.localidad
        }));
    };

    const snackbarMessages = {
        fetchError: (error) => `Error al obtener los comercios: ${error}`,
        deleteSuccess: (message) => message,
        deleteError: (error) => `Error al eliminar el comercio: ${error}`,
        actionCancelled: 'Acción cancelada'
    };

    const toolbarProps = {
        show_btn_add: allowCreate,
        txt_btn_add: 'Nuevo Comercio',
        url_btn_add: '/comercios/form'
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
                Comercios
            </Typography>
            <List
                apiUrl={`${API}/comercios`}
                editUrl='/comercios/form'
                detailUrl='/comercios'
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
