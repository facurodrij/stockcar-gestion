import React, {useState, useEffect} from 'react'
import Typography from '@mui/material/Typography';
import {DataGrid, GridRowsProp, GridColDef, useGridApiRef, GridActionsCellItem} from '@mui/x-data-grid';
import {esES} from '@mui/x-data-grid/locales';
import {Button, TextField} from '@mui/material';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import Box from "@mui/material/Box";
import {GridRowParams} from "@mui/x-data-grid";
import VisibilityIcon from '@mui/icons-material/Visibility';
import dayjs from "dayjs";
import {currencyFormatter} from "../../utils/formatters";
import SaleDetailDialog from "./detail";

const API = process.env.REACT_APP_API_URL;

export default function Index() {
    const [salesList, setSalesList] = useState([]);
    const [salesSelectedList, setSalesSelectedList] = useState([]);
    const [from, setFrom] = useState(null);
    const [to, setTo] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    const fetchSalesData = async () => {
        const fromStr = from ? from.toISOString() : '';
        const toStr = to ? to.toISOString() : '';

        const url = `${API}/ventas?desde=${fromStr}&hasta=${toStr}`;

        const res = await fetch(url);
        const data = await res.json();
        setSalesList(data.ventas)
    }

    const columns: GridColDef[] = [
        {field: 'id', headerName: 'ID', maxWidth: 320, hidden: true},
        {
            field: 'fecha', headerName: 'Fecha', type: 'dateTime', minWidth: 150,
            valueGetter: (value) => value && new Date(value),
            valueFormatter: (value) => dayjs(value).format('DD/MM/YYYY HH:mm')
        },
        {field: 'tipo_doc', headerName: 'Tipo', maxWidth: 50},
        {field: 'letra', headerName: 'Letra', maxWidth: 50},
        {field: 'nro_doc', headerName: 'Número', minWidth: 150},
        {field: 'cliente', headerName: 'Cliente', minWidth: 200},
        {
            field: 'gravado', headerName: 'Gravado',
            valueFormatter: (value) => currencyFormatter.format(value)
        },
        {
            field: 'total', headerName: 'Total',
            valueFormatter: (value) => currencyFormatter.format(value)
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Acciones',
            getActions: (params: GridRowParams) => [
                <GridActionsCellItem
                    icon={<VisibilityIcon/>}
                    label="Detalle"
                    onClick={() => handleShowDetail()}
                    showInMenu
                />,
                <GridActionsCellItem
                    icon={<VisibilityIcon/>}
                    label="Otra..."
                    onClick={() => console.log(params.row)}
                    showInMenu
                />
            ]
        }
    ];

    let rows: GridRowsProp = salesList.map((venta) => ({
        id: venta.id,
        fecha: venta.fecha,
        tipo_doc: venta.tipo_doc,
        letra: venta.letra,
        nro_doc: venta.nro_doc,
        cliente: venta.nombre_cliente,
        gravado: venta.gravado,
        total: venta.total
    }));

    const handleShowDetail = (venta) => {
        setSalesSelectedList(venta);
        setShowDetail(true); // Abre el SaleDetailDialog
    }

    const handleCloseDetail = () => {
        setSalesSelectedList(null);
        setShowDetail(false); // Cierra el SaleDetailDialog
    }

    return (
        <>
            <Typography
                variant="h4"
                sx={{
                    mt: 2,
                    fontFamily: 'roboto',
                    color: 'inherit'
                }}
            >
                Ventas
            </Typography>

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
                    onClick={fetchSalesData}
                >
                    Buscar
                </Button>
            </Box>
            <div style={{height: 350, width: '100%'}}>
                <DataGrid
                    rows={rows}
                    rowHeight={30}
                    checkboxSelection={true}
                    columns={columns}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                />
            </div>
            <SaleDetailDialog open={showDetail} onClose={handleCloseDetail} venta={salesSelectedList}/>
        </>
    )
}