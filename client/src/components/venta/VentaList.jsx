import React, { useState } from 'react'
import {
    DataGrid,
    GridActionsCellItem,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarDensitySelector,
    GridToolbarExport,
    GridToolbarFilterButton, GridToolbarQuickFilter
} from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import dayjs from "dayjs";
import { API } from "../../App";
import { Link } from "react-router-dom";
import { esES } from "@mui/x-data-grid/locales";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import fetchWithAuth from '../../utils/fetchWithAuth';
import SnackbarAlert from '../shared/SnackbarAlert';
import { useLoading } from '../../utils/loadingContext';


export default function VentaList({ onlyOrders }) {
    const [list, setList] = useState([]);
    const [from, setFrom] = useState(null);
    const [to, setTo] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const { withLoading } = useLoading();

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    }

    const fetchData = async () => {
        const fromStr = from ? from.toISOString() : null;
        const toStr = to ? to.toISOString() : null;
        let url = onlyOrders ? `${API}/ventas-orden` : `${API}/ventas`;
        url = (from || to) ? `${url}?desde=${fromStr}&hasta=${toStr}` : url;
        withLoading(async () => {
            try {
                const res = await fetchWithAuth(url);
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data['error']);
                }
                setList(data['ventas']);
            } catch (error) {
                console.error(error);
                setSnackbar({
                    message: `Error al obtener las ventas: ${error.message}`,
                    severity: 'error',
                    autoHideDuration: null,
                    onClose: handleCloseSnackbar
                });
                setOpenSnackbar(true);
            }
        });
    };

    const CustomToolbar = () => {
        return (
            <GridToolbarContainer>
                <GridToolbarQuickFilter size={'small'} />
                <GridToolbarColumnsButton />
                <GridToolbarFilterButton />
                <GridToolbarDensitySelector />
                <GridToolbarExport />
                <Box sx={{ flexGrow: 1 }} />
                <Button
                    startIcon={<AddIcon />}
                    component={Link}
                    to={onlyOrders ? '/ventas-orden/form' : '/ventas/form'}
                    size="small"
                    variant="contained"
                >
                    {onlyOrders ? 'Nueva orden' : 'Nueva venta'}
                </Button>
            </GridToolbarContainer>
        );
    }

    const columns = [
        { field: 'cod_articulo', headerName: 'Códigos de artículos', flex: 3 },
        {
            field: 'fecha_hora', headerName: 'Fecha y hora', type: 'dateTime', flex: 1,
            valueFormatter: (value) => {
                if (!value) {
                    return "";
                }
                return dayjs(value, 'YYYY-MM-DDTHH:mm:ss').format('DD/MM/YYYY HH:mm:ss');
            }
        },
        { field: 'tipo_comprobante', headerName: 'Comprobante', flex: 1 },
        { field: 'nro_comprobante', headerName: 'Número', flex: 1 },
        { field: 'cliente', headerName: 'Cliente', flex: 1 },
        {
            field: 'total', headerName: 'Total', flex: 1,
            valueFormatter: (value) => {
                return new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS'
                }).format(value);
            }
        },
        { field: 'estado', headerName: 'Estado', flex: 1 },
        {
            field: 'actions', type: 'actions', headerName: 'Acciones', flex: 0.5,
            getActions: (params) => {
                const actions = [];
                if (onlyOrders) {
                    actions.push(
                        <GridActionsCellItem
                            icon={<EditIcon />}
                            label="Editar"
                            component={Link}
                            to={`/ventas-orden/form/${params.row.id}`}
                            showInMenu
                        />
                    );
                    return actions;
                }
                actions.push(
                    <GridActionsCellItem
                        icon={<VisibilityIcon />}
                        label="Detalle"
                        component={Link}
                        to={`/ventas/${params.row.id}`}
                        showInMenu
                    />,
                    <GridActionsCellItem
                        icon={<EditIcon />}
                        label="Editar"
                        component={Link}
                        to={`/ventas/form/${params.row.id}`}
                        showInMenu
                    />
                );
                return actions;
            }
        }
    ]

    let rows = list.map((item) => {
        return {
            id: item.id,
            fecha_hora: item.fecha_hora,
            tipo_comprobante: item.tipo_comprobante.descripcion,
            nro_comprobante: item.nro_comprobante,
            cliente: item.nombre_cliente,
            total: item.total,
            estado: item.estado,
            cod_articulo: item.cod_articulos
        }
    });

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
                        sx={{ mr: 2 }}
                    />
                    <DatePicker
                        label="Hasta"
                        value={to}
                        onChange={(newValue) => setTo(newValue)}
                        sx={{ mr: 2 }}
                    />
                </LocalizationProvider>

                <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={fetchData}
                >
                    Buscar
                </Button>
            </Box>
            <div style={{ height: 500, width: '100%' }}>
                <DataGrid
                    columns={columns}
                    rows={rows}
                    disableRowSelectionOnClick
                    rowHeight={30}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    initialState={{ 
                        sorting: { 
                            sortModel: [{ field: 'fecha_hora', sort: 'desc' }] 
                        },
                        columns: {
                            columnVisibilityModel: {
                                cod_articulo: false
                            }
                        }
                    }}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    slots={{ toolbar: CustomToolbar }}
                />
            </div>
            <SnackbarAlert
                open={openSnackbar}
                message={snackbar.message}
                severity={snackbar.severity}
                autoHideDuration={snackbar.autoHideDuration}
                onClose={snackbar.onClose}
            />
        </>
    );
};
