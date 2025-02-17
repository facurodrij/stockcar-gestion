import React, { useEffect } from 'react';
import checkPermissions from '../../../../../config/auth/checkPermissions';
import { API } from '../../../../../App';
import List from '../../../../../common/components/List';
import PageTitle from '../../../../../common/components/PageTitle';

export default function ClienteList({ permissions }) {
    const apiUrl = `${API}/clientes`;
    const editUrl = '/clientes/form';
    const detailUrl = null; // Aun no se implementa la vista de detalle
    const allowView = false; // Aun no se implementa la vista de detalle
    const allowCreate = checkPermissions(['cliente.create'], false);
    const allowUpdate = checkPermissions(['cliente.update'], false);
    const allowDelete = false; // Aun no se implementa la eliminación

    useEffect(() => {
        checkPermissions(permissions);
    }, [permissions]);

    const columns = [
        { field: 'tipo_responsable', headerName: 'Tipo responsable', flex: 1 },
        { field: 'razon_social', headerName: 'Razón social', flex: 1.5 },
        { field: 'tipo_documento', headerName: 'Tipo documento', flex: 1 },
        { field: 'nro_documento', headerName: 'Nro. documento', flex: 1 },
        { field: 'direccion', headerName: 'Dirección', flex: 1 },
        { field: 'localidad', headerName: 'Localidad', flex: 1 }
    ];

    const mapDataToRows = (data) => {
        return data['clientes'].map(item => ({
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
        fetchError: (error) => `Error al obtener los clientes: ${error}`,
        deleteSuccess: (message) => message,
        deleteError: (error) => `Error al eliminar el cliente: ${error}`,
        actionCancelled: 'Acción cancelada'
    };

    const toolbarProps = {
        show_btn_add: allowCreate,
        txt_btn_add: 'Nuevo Cliente',
        url_btn_add: '/clientes/form'
    };

    return (
        <>
            <PageTitle heading='Clientes' />
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
