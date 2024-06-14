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
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import dayjs from "dayjs";
import {API} from "../../App";
import ClienteDetailDialog from "./ClienteDetailDialog";
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
                to="/clientes/form"
                size="small"
            >Nuevo Cliente
            </Button>
            <GridToolbarColumnsButton/>
            <GridToolbarFilterButton/>
            <GridToolbarDensitySelector/>
            <GridToolbarExport/>
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
        {field: 'id', headerName: 'ID', width: 75},
        {field: 'tipo_responsable', headerName: 'Tipo Responsable', width: 200},
        {field: 'razon_social', headerName: 'Razón Social', width: 250},
        {field: 'tipo_documento', headerName: 'Tipo Documento', width: 100},
        {field: 'nro_documento', headerName: 'Nro. Documento', width: 150},
        {
            field: 'fecha_nacimiento', headerName: 'Fecha Nacimiento', minWidth: 150, type: 'date',
            valueFormatter: (value) => {
                if (!value) {
                    return "";
                }
                return dayjs(value, 'YYYY-MM-DD').format('DD/MM/YYYY')
            }
        },
        {field: 'direccion', headerName: 'Dirección', width: 300},
        {field: 'localidad', headerName: 'Localidad', width: 200},
        {
            field: 'actions', type: 'actions', headerName: 'Acciones', width: 100,
            getActions: (params: GridRowParams) => [
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

    let rows: GridRowsProp = list.map((item) => {
        return {
            id: item.id,
            tipo_responsable: item.tipo_responsable['descripcion'] || '',
            razon_social: item.razon_social,
            tipo_documento: item.tipo_documento['descripcion'] || '',
            nro_documento: item.nro_documento,
            fecha_nacimiento: item.fecha_nacimiento,
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
                    rows={rows}
                    rowHeight={30}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    checkboxSelection
                    disableRowSelectionOnClick
                    initialState={{sorting: {sortModel: [{field: 'id', sort: 'desc'}]}}}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    slots={{toolbar: CustomToolbar}}
                />
            </div>
            <ClienteDetailDialog item={itemSelected} open={showDetail} onClose={handleCloseDetail}/>
        </>
    );
};
