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
    GridToolbarFilterButton, GridToolbarQuickFilter
} from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import dayjs from "dayjs";
import {API} from "../../App";
import ClienteDetailDialog from "./ClienteDetailDialog";
import {Link} from "react-router-dom";
import {esES} from "@mui/x-data-grid/locales";
import {Button} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";

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
                to="/clientes/form"
                size="small"
                variant="contained"
            >
                Nuevo Cliente
            </Button>
        </GridToolbarContainer>
    );
}


export default function ClienteList() {
    const [list, setList] = useState([]);
    const [itemSelected, setItemSelected] = useState(null);
    const [itemsSelectedList, setItemsSelectedList] = useState([]);
    const [showDetail, setShowDetail] = useState(false);

    const fetchData = async () => {
        const res = await fetch(`${API}/clientes`);
        return await res.json();
    }

    useEffect(() => {
        fetchData().then(data => {
            setList(data['clientes']);
        });
    }, []);

    const columns = [
        {field: 'id', headerName: 'ID', flex: 0.5},
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
                    icon={<VisibilityIcon/>}
                    label="Detalle"
                    onClick={() => handleShowDetail(params.row)}
                    showInMenu
                />,
                <GridActionsCellItem
                    icon={<EditIcon/>}
                    label="Editar"
                    component={Link}
                    to={`/clientes/form/${params.row.id}`}
                    showInMenu
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

    const handleShowDetail = (item) => {
        setItemSelected(item);
        setShowDetail(true);
    }

    const handleCloseDetail = () => {
        setItemSelected(null);
        setShowDetail(false);
    }

    return (
        <>
            <div style={{height: 500, width: '100%'}}>
                <DataGrid
                    columns={columns}
                    rows={rows}
                    rowHeight={30}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    checkboxSelection
                    initialState={{sorting: {sortModel: [{field: 'id', sort: 'desc'}]}}}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    slots={{toolbar: CustomToolbar}}
                    ignoreDiacritics
                />
            </div>
            <ClienteDetailDialog item={itemSelected} open={showDetail} onClose={handleCloseDetail}/>
        </>
    );
};
