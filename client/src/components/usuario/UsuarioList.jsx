import React, {useEffect, useState} from 'react'
import {
    DataGrid,
    GridActionsCellItem,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarDensitySelector,
    GridToolbarExport,
    GridToolbarFilterButton, GridToolbarQuickFilter
} from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import {API} from "../../App";
import {Link} from "react-router-dom";
import {esES} from "@mui/x-data-grid/locales";
import {Button} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import fetchWithAuth from '../../utils/fetchWithAuth';

const CustomToolbar = () => {
    return (
        <GridToolbarContainer>
            <GridToolbarQuickFilter size={'small'}/>
            <GridToolbarColumnsButton/>
            <GridToolbarFilterButton/>
            <GridToolbarDensitySelector/>
            <GridToolbarExport/>
            <Box sx={{ flexGrow: 1 }} />
            <Button
                startIcon={<AddIcon/>}
                component={Link}
                to="/usuarios/form"
                size="small"
                variant="contained"
            >
                Nuevo Usuario
            </Button>
        </GridToolbarContainer>
    );
}

export default function UsuarioList() {
    const [list, setList] = useState([]);

    const fetchData = async () => {
        const url = `${API}/usuarios`;
        try {
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(`${res.status} (${res.statusText})`);
            }
            setList(data['usuarios']);
        } catch (error) {
            console.error(error);
            alert('Error al cargar los datos');
        }
    }

    useEffect(() => {
        fetchData();
    } , []);

    const columns = [
        {field: 'username', headerName: 'Usuario', flex: 1},
        {field: 'email', headerName: 'Email', flex: 2},
        {field: 'first_name', headerName: 'Nombre', flex: 1},
        {field: 'last_name', headerName: 'Apellido', flex: 1},
        {
            field: 'is_superuser', headerName: 'Superusuario', flex: 1,
            valueGetter: (value) => value ? 'Sí' : 'No'
        },
        {
            field: 'is_staff', headerName: 'Staff', flex: 1,
            valueGetter: (value) => value ? 'Sí' : 'No'
        },
        {
            field: 'actions', type: 'actions', headerName: 'Acciones', flex: 1,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<EditIcon/>}
                    label="Editar"
                    component={Link}
                    to={`/usuarios/form/${params.row.id}`}
                    showInMenu
                />
            ]
        }
    ]

    let rows = list.map((item) => {
        return {
            id: item.id,
            username: item.username,
            email: item.email,
            first_name: item.nombre,
            last_name: item.apellido,
            is_superuser: item.is_superuser,
            is_staff: item.is_staff
        }
    });

    return (
        <>
            <div style={{height: 500, width: '100%'}}>
                <DataGrid
                    columns={columns}
                    rows={rows}
                    disableRowSelectionOnClick
                    rowHeight={30}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    initialState={{sorting: {sortModel: [{field: 'id', sort: 'desc'}]}}}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    slots={{toolbar: CustomToolbar}}
                />
            </div>
        </>
    );
};
