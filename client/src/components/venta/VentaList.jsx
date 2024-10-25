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
import dayjs from "dayjs";
import { API } from "../../App";
import { Link } from "react-router-dom";
import { esES } from "@mui/x-data-grid/locales";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Button, Box, Chip } from "@mui/material";
import fetchWithAuth from '../../utils/fetchWithAuth';
import SnackbarAlert from '../shared/SnackbarAlert';
import { Search, Add, Visibility, Edit, Done, Block, Info, Delete } from '@mui/icons-material';
import { useLoading } from '../../utils/loadingContext';
import { useConfirm } from 'material-ui-confirm';


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
    const [loading, setLoading] = useState(false);

    const confirm = useConfirm();

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    }

    const fetchData = async () => {
        setLoading(true);
        const fromStr = from ? from.toISOString() : '';
        const toStr = to ? to.toISOString() : '';
        let url = onlyOrders ? `${API}/ventas-orden` : `${API}/ventas`;
        url = (from || to) ? `${url}?desde=${fromStr}&hasta=${toStr}` : url;
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
        } finally {
            setLoading(false);
        }
    }

    const CustomToolbar = () => {
        return (
            <GridToolbarContainer sx={{ borderBottom: 1, borderColor: 'divider', pb: .5 }}>
                {onlyOrders ? (
                    <>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button
                            startIcon={<Add />}
                            component={Link}
                            to='/ventas-orden/form'
                            size="small"
                            variant="contained"
                            color='success'
                        >
                            Nueva orden
                        </Button>
                    </>
                ) : (
                    <>
                        <GridToolbarQuickFilter size={'small'} />
                        <GridToolbarColumnsButton />
                        <GridToolbarFilterButton />
                        <GridToolbarDensitySelector />
                        <GridToolbarExport />
                        <Box sx={{ flexGrow: 1 }} />
                        <Button
                            startIcon={<Add />}
                            component={Link}
                            to='/ventas/form'
                            size="small"
                            variant="contained"
                            color='success'
                        >
                            Nueva venta
                        </Button>
                    </>
                )}
            </GridToolbarContainer>
        );
    }

    const columns = [
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
        {
            field: 'estado',
            headerName: 'Estado',
            flex: 1,
            renderCell: (params) => {
                let color;
                let icon;
                switch (params.value) {
                    case 'Ticket':
                        color = 'success';
                        icon = <Done />;
                        break;
                    case 'Facturado':
                        color = 'success';
                        icon = <Done />;
                        break;
                    case 'Anulado':
                        color = 'error';
                        icon = <Block />;
                        break;
                    case 'Orden':
                        color = 'info';
                        icon = <Info />;
                        break;
                    default:
                        color = 'default';
                        icon = null;
                }
                return <Chip variant='outlined' label={params.value} color={color} size='small' icon={icon} />;
            },
        },
        {
            field: 'actions', type: 'actions', headerName: 'Acciones', flex: 0.75,
            getActions: (params) => {
                const actions = [];
                actions.push(
                    <GridActionsCellItem
                        icon={<Visibility />}
                        component={Link}
                        to={`/ventas/${params.row.id}`}
                    />
                );
                if (onlyOrders) {
                    actions.push(
                        <GridActionsCellItem
                            icon={<Edit />}
                            component={Link}
                            to={`/ventas-orden/form/${params.row.id}`}
                        />,
                        <GridActionsCellItem
                            icon={<Delete />}
                            onClick={() => handleDelete(params.row.id)}
                        />
                    );
                    return actions;
                }
                actions.push(
                    <GridActionsCellItem
                        icon={<Edit />}
                        component={Link}
                        to={`/ventas/form/${params.row.id}`}
                    />
                );
                if (params.row.estado === 'Orden') {
                    actions.push(
                        <GridActionsCellItem
                            icon={<Delete />}
                            onClick={() => handleDelete(params.row.id)}
                        />
                    );
                }
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
            estado: item.estado
        }
    });

    const handleDelete = async (pk) => {
        confirm({
            title: 'Confirmar acción',
            description: '¿Está seguro que desea eliminar la orden de venta?',
            cancellationText: 'Cancelar',
            confirmationText: 'Confirmar'

        })
            .then(() => {
                withLoading(async () => {
                    const url = `${API}/ventas-orden/${pk}/delete`;
                    fetchWithAuth(url, 'DELETE')
                        .then(response => {
                            if (!response.ok) {
                                return response.json().then(data => {
                                    throw new Error(data['error']);
                                });
                            }
                            return response.json();
                        })
                        .then(data => {
                            setList(list.filter(item => item.id !== pk));
                            setSnackbar({
                                message: data['message'],
                                severity: 'success',
                                autoHideDuration: 4000,
                                onClose: () => handleCloseSnackbar()
                            });
                            setOpenSnackbar(true);
                        })
                        .catch((error) => {
                            setSnackbar({
                                message: `Error al eliminar la orden de venta: ${error.message}`,
                                severity: 'error',
                                autoHideDuration: 6000,
                                onClose: () => handleCloseSnackbar()
                            });
                            setOpenSnackbar(true);
                        });
                });
            })
            .catch((error) => {
                setSnackbar({
                    message: 'Acción cancelada',
                    severity: 'info',
                    autoHideDuration: 4000,
                    onClose: () => handleCloseSnackbar()
                });
                setOpenSnackbar(true);
            });
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
                    startIcon={<Search />}
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
                    loading={loading}
                    columns={columns}
                    rows={rows}
                    disableRowSelectionOnClick
                    rowHeight={30}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    initialState={{
                        sorting: {
                            sortModel: [{ field: 'fecha_hora', sort: 'desc' }]
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
