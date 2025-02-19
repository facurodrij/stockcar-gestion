import React, { useEffect } from 'react';
import checkPermissions from '../../../../../config/auth/checkPermissions';
import { API } from '../../../../../App';
import List from '../../../../../common/components/List';
import PageTitle from '../../../../../common/components/PageTitle';

export default function ComercioList({ permissions }) {
    const apiUrl = `${API}/comercios`;
    const editUrl = '/comercios/form';
    const detailUrl = null; // Aun no se implementa la vista de detalle
    const allowView = false; // Aun no se implementa la vista de detalle
    const allowCreate = checkPermissions(['comercio.create'], false);
    const allowUpdate = checkPermissions(['comercio.update'], false);
    const allowDelete = false; // Aun no se implementa la eliminación

    useEffect(() => {
        checkPermissions(permissions);
    }, [permissions]);

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
            <PageTitle heading='Comercios' />
            <List
                apiUrl={apiUrl}
                editUrl={editUrl}
                detailUrl={detailUrl}
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
