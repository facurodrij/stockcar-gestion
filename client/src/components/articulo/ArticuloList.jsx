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
                to="/articulos/form"
                size="small"
                variant="contained"
            >
                Nuevo Artículo
            </Button>
        </GridToolbarContainer>
    );
}


export default function ArticuloList() {
    const [list, setList] = useState([]);

    const fetchData = async () => {
        const url = `${API}/articulos`;
        try {
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(`${res.status} (${res.statusText})`);
            }
            setList(data['articulos']);
        } catch (error) {
            console.error(error);
            alert('Error al cargar los datos');
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const columns = [
        {field: 'descripcion', headerName: 'Descripción', flex: 1.5},
        {field: 'codigo_barras', headerName: 'Código de barras', flex: 1},
        {field: 'codigo_fabricante', headerName: 'Código de fabricante', flex: 1},
        {field: 'codigo_proveedor', headerName: 'Código de proveedor', flex: 1},
        {field: 'codigo_interno', headerName: 'Código interno', flex: 1},
        {
            field: 'actions', type: 'actions', headerName: 'Acciones', flex: 0.5,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<EditIcon/>}
                    label="Editar"
                    component={Link}
                    to={`/articulos/form/${params.row.id}`}
                    showInMenu
                />
            ]
        }
    ];

    let rows = list.map(item => {
        return {
            id: item.id,
            codigo_barras: item.codigo_barras,
            codigo_fabricante: item.codigo_fabricante,
            codigo_proveedor: item.codigo_proveedor,
            codigo_interno: item.codigo_interno,
            descripcion: item.descripcion,
        }
    });

    return (
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
    );
};
