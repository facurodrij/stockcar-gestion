import React, {useEffect, useState} from 'react'
import {
    DataGrid,
    GridActionsCellItem,
    GridRowParams,
    GridRowsProp,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarDensitySelector,
    GridToolbarExport,
    GridToolbarFilterButton
} from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import {API} from "../../App";
import {Link} from "react-router-dom";
import {esES} from "@mui/x-data-grid/locales";
import {Button} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";


function CustomToolbar() {
    return (
        <GridToolbarContainer>
            <Button
                startIcon={<AddIcon/>}
                component={Link}
                to="/articulos/form"
                size="small"
            >Nuevo Artículo
            </Button>
            <GridToolbarColumnsButton/>
            <GridToolbarFilterButton/>
            <GridToolbarDensitySelector/>
            <GridToolbarExport/>
        </GridToolbarContainer>
    );
}


export default function ArticuloList() {
    const [list, setList] = useState([]);
    const [itemSelected, setItemSelected] = useState(null);
    const [itemsSelectedList, setItemsSelectedList] = useState([]);
    const [showDetail, setShowDetail] = useState(false);

    const fetchData = async () => {
        const res = await fetch(`${API}/articulos`);
        return await res.json();
    }

    useEffect(() => {
        fetchData().then(data => {
            setList(data['articulos']);
        });
    }, []);

    const columns = [
        {field: 'id', headerName: 'ID', width: 75},
        {field: 'codigo_barras', headerName: 'Código de barras', width: 150},
        {field: 'codigo_fabricante', headerName: 'Código de fabricante', width: 150},
        {field: 'codigo_proveedor', headerName: 'Código de proveedor', width: 150},
        {field: 'codigo_interno', headerName: 'Código interno', width: 150},
        {field: 'descripcion', headerName: 'Descripción', width: 250},
        {field: 'tipo_unidad', headerName: 'Tipo de unidad', width: 100},
        {
            field: 'actions', type: 'actions', headerName: 'Acciones', width: 100,
            getActions: (params: GridRowParams) => [
                // <GridActionsCellItem
                //     icon={<VisibilityIcon/>}
                //     label="Detalle"
                //     onClick={() => handleShowDetail(params.row)}
                //     showInMenu
                // />,
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

    const rows: GridRowsProp = list.map(item => {
        return {
            id: item.id,
            codigo_barras: item.codigo_barras,
            codigo_fabricante: item.codigo_fabricante,
            codigo_proveedor: item.codigo_proveedor,
            codigo_interno: item.codigo_interno,
            descripcion: item.descripcion,
            tipo_unidad: item.tipo_unidad['nombre']
        }
    });

    return (
        <div style={{height: 500, width: '100%'}}>
            <DataGrid
                rows={rows}
                rowHeight={30}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                checkboxSelection
                initialState={{sorting: {sortModel: [{field: 'id', sort: 'desc'}]}}}
                localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                slots={{toolbar: CustomToolbar}}
            />
        </div>
    );
};
