import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import { checkAuth, checkPermissions } from '../../utils/checkAuth';
import List from '../../components/shared/List';
import { API } from '../../App';

export default function UsuarioPage() {
    useEffect(() => {
        checkAuth();
        if (!checkPermissions(['usuario.view_all'])) {
            window.location.href = '/unauthorized';
        }
    }, []);

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
            <Typography
                variant="h4"
                sx={{
                    mt: 2,
                    mb: 2,
                    fontFamily: 'roboto',
                    color: 'inherit'
                }}
            >
                Usuarios
            </Typography>
            <List
                apiUrl={`${API}/usuarios`}
                editUrl='/usuarios/form'
                detailUrl='/usuarios'
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
