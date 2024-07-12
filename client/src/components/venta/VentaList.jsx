import React, {useEffect, useState} from 'react'
import {DataGrid, GridActionsCellItem, GridRowParams, GridRowsProp} from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import dayjs from "dayjs";
import {API} from "../../App";
import {Link} from "react-router-dom";
import {esES} from "@mui/x-data-grid/locales";
import {currencyFormatter} from "../../utils/formatters";
import {VentaDetailDialog} from "./index";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import {Button} from "@mui/material";
import Box from "@mui/material/Box";


export default function VentaList() {
    const [list, setList] = useState([]);
    const [itemSelected, setItemSelected] = useState(null);
    const [itemsSelectedList, setItemsSelectedList] = useState([]);
    const [from, setFrom] = useState(null);
    const [to, setTo] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    const fetchData = async () => {
        const fromStr = from ? from.toISOString() : null;
        const toStr = to ? to.toISOString() : null;
        const url = (from || to) ? `${API}/ventas?desde=${fromStr}&hasta=${toStr}` : `${API}/ventas`;
        const res = await fetch(url);
        const data = await res.json();
        setList(data['ventas']);
    }

    const columns = [
        {field: 'id', headerName: 'ID', width: 75},
        {
            field: 'fecha_hora', headerName: 'Fecha y Hora', type: 'dateTime', width: 150,
            valueFormatter: (value) => {
                if (!value) {
                    return "";
                }
                return dayjs(value, 'YYYY-MM-DDTHH:mm:ss').format('DD/MM/YYYY HH:mm:ss');
            }
        },
        {field: 'tipo_comprobante', headerName: 'Comprobante', width: 100},
        // {field: 'letra', headerName: 'Letra', width: 50},
        {field: 'nro_doc', headerName: 'Número', width: 150},
        {field: 'cliente', headerName: 'Cliente', width: 200},
        {
            field: 'gravado', headerName: 'Gravado',
            valueFormatter: (value) => currencyFormatter.format(value)
        },
        {
            field: 'total', headerName: 'Total',
            valueFormatter: (value) => currencyFormatter.format(value)
        },
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
                    to={`/ventas/form/${params.row.id}`}
                    showInMenu
                />
            ]
        }
    ]

    let rows: GridRowsProp = list.map((item) => {
        return {
            id: item.id,
            fecha_hora: item.fecha_hora,
            tipo_comprobante: item.tipo_comprobante.descripcion,
            // letra: item.letra,
            nro_doc: item.nro_doc,
            cliente: item.nombre_cliente,
            gravado: item.gravado,
            total: item.total
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
            <Box
                component="form"
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    m: 2
                }}
                noValidate
                autoComplete="off"
            >
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'es'}>
                    <DatePicker
                        label="Desde"
                        value={from}
                        onChange={(newValue) => setFrom(newValue)}
                        sx={{mr: 2}}
                    />
                    <DatePicker
                        label="Hasta"
                        value={to}
                        onChange={(newValue) => setTo(newValue)}
                        sx={{mr: 2}}
                    />
                </LocalizationProvider>

                <Button
                    variant="contained"
                    color="primary"
                    sx={{mt: 2}}
                    onClick={fetchData}
                >
                    Buscar
                </Button>
            </Box>
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
                />
            </div>
            <VentaDetailDialog item={itemSelected} open={showDetail} onClose={handleCloseDetail}/>
        </>
    );
};
