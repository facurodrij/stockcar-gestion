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
        <GridToolbarContainer sx={{ borderBottom: 1, borderColor: 'divider', pb: .5 }}>
            <GridToolbarQuickFilter size={'small'}/>
            <GridToolbarColumnsButton/>
            <GridToolbarFilterButton/>
            <GridToolbarDensitySelector/>
            <GridToolbarExport/>
            <Box sx={{ flexGrow: 1 }} />
            <Button
                startIcon={<AddIcon/>}
                component={Link}
                to="/clientes/form"
                size="small"
                variant="contained"
                color="success"
            >
                Nuevo Cliente
            </Button>
        </GridToolbarContainer>
    );
}


export default function ClienteList() {
    const [list, setList] = useState([]);

    const fetchData = async () => {
        const url = `${API}/clientes`;
        try {
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(`${res.status} (${res.statusText})`);
            }
            setList(data['clientes']);
        } catch (error) {
            console.error(error);
            alert('Error al cargar los datos');
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const columns = [
        {field: 'tipo_responsable', headerName: 'Tipo responsable', flex: 1},
        {field: 'razon_social', headerName: 'Razón social', flex: 1.5},
        {field: 'tipo_documento', headerName: 'Tipo documento', flex: 1},
        {field: 'nro_documento', headerName: 'Nro. documento', flex: 1},
        {field: 'direccion', headerName: 'Dirección', flex: 1},
        {field: 'localidad', headerName: 'Localidad', flex: 1},
        {
            field: 'actions', type: 'actions', headerName: 'Acciones', flex: 0.5,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<EditIcon/>}
                    component={Link}
                    to={`/clientes/form/${params.row.id}`}
                />
            ]
        }
    ]

    let rows = list.map((item) => {
        return {
            id: item.id,
            tipo_responsable: item.tipo_responsable['descripcion'] || '',
            razon_social: item.razon_social,
            tipo_documento: item.tipo_documento['descripcion'] || '',
            nro_documento: item.nro_documento,
            direccion: item.direccion,
            localidad: item.localidad
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
                    ignoreDiacritics
                />
            </div>
        </>
    );
};
