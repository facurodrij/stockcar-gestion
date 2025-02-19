import React, { useEffect } from 'react';
import { API } from '../../../../../App';
import List from '../../../../../common/components/List';
import PageTitle from '../../../../../common/components/PageTitle';
import checkPermissions from '../../../../../config/auth/checkPermissions';


export default function UsuarioList({ permissions }) {
    useEffect(() => {
        checkPermissions(permissions);
    }, [permissions]);

    const apiUrl = `${API}/usuarios`;
    const editUrl = '/usuarios/form';
    const detailUrl = '/usuarios';
    const allowView = false;
    const allowCreate = checkPermissions(['usuario.create']);
    const allowUpdate = checkPermissions(['usuario.update']);
    const allowDelete = false;

    const columns = [
        { field: 'username', headerName: 'Usuario', flex: 1 },
        { field: 'email', headerName: 'Email', flex: 2 },
        { field: 'first_name', headerName: 'Nombre', flex: 1 },
        { field: 'last_name', headerName: 'Apellido', flex: 1 },
        {
            field: 'is_superuser', headerName: 'Superusuario', flex: 1,
            valueGetter: (value) => value ? 'Sí' : 'No'
        },
        {
            field: 'is_staff', headerName: 'Staff', flex: 1,
            valueGetter: (value) => value ? 'Sí' : 'No'
        }
    ];

    const mapDataToRows = (data) => {
        return data['usuarios'].map(item => ({
            id: item.id,
            username: item.username,
            email: item.email,
            first_name: item.nombre,
            last_name: item.apellido,
            is_superuser: item.is_superuser,
            is_staff: item.is_staff
        }));
    };

    const snackbarMessages = {
        fetchError: (error) => `Error al obtener los usuarios: ${error}`,
        deleteSuccess: (message) => message,
        deleteError: (error) => `Error al eliminar el usuario: ${error}`,
        actionCancelled: 'Acción cancelada'
    };

    const toolbarProps = {
        show_btn_add: allowCreate,
        txt_btn_add: 'Nuevo Usuario',
        url_btn_add: '/usuarios/form'
    };

    return (
        <>
            <PageTitle heading='Usuarios' />
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
    );
}