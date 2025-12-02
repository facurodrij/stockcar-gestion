import React, { useState, useEffect, useCallback } from 'react';
import { Link } from "react-router-dom";
import {
    DataGrid,
    GridActionsCellItem,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarQuickFilter
} from '@mui/x-data-grid';
import dayjs from "dayjs";
import { esES } from "@mui/x-data-grid/locales";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Button, Box, Chip } from "@mui/material";
import { Add, Visibility, Edit, Done, Block, Info, Delete } from '@mui/icons-material';
import { useConfirm } from 'material-ui-confirm';
import { API } from '../../../../../App';
import { useLoading } from '../../../../../common/contexts/LoadingContext';
import fetchWithAuth from '../../../../../config/auth/fetchWithAuth';
import SnackbarAlert from '../../../../../common/components/SnackbarAlert';
import checkPermissions from '../../../../../config/auth/checkPermissions';
import PageTitle from '../../../../../common/components/PageTitle';


export default function CompraList({ permissions }) {
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
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState({
        pageSize: 50,
        page: 0,
    });
    const confirm = useConfirm();

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    }

    const fetchData = useCallback(async () => {
        setLoading(true);
        const fromStr = from ? from.toISOString() : '';
        const toStr = to ? to.toISOString() : '';
        let url = `${API}/compras`;
        url = `${url}?page=${paginationModel.page + 1}&pageSize=${paginationModel.pageSize}`;
        url = (from || to) ? `${url}&desde=${fromStr}&hasta=${toStr}` : url;
        try {
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data['error']);
            }
            setList(data['compras']);
            setRowCount(data.total);
        } catch (error) {
            console.error(error);
            setSnackbar({
                message: `Error al obtener los registros: ${error.message}`,
                severity: 'error',
                autoHideDuration: null,
                onClose: handleCloseSnackbar
            });
            setOpenSnackbar(true);
        } finally {
            setLoading(false);
        }
    }, [from, to, paginationModel]);

    useEffect(() => {
        checkPermissions(permissions);
    }, [permissions]);

    useEffect(() => {
        fetchData();
    }, [fetchData, paginationModel]);

    const CustomToolbar = () => {
        return (
            <GridToolbarContainer sx={{ borderBottom: 1, borderColor: 'divider', pb: .5 }}>
                <>
                    <GridToolbarQuickFilter size={'small'} />
                    <GridToolbarColumnsButton />
                    <Box sx={{ flexGrow: 1 }} />
                    <Button
                        startIcon={<Add />}
                        component={Link}
                        to='/compras/form'
                        size="small"
                        variant="contained"
                        color='success'
                    >
                        Nueva compra
                    </Button>
                </>
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
        { field: 'proveedor', headerName: 'Proveedor', flex: 1 },
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
                let text;
                switch (params.value) {
                    case 'ticket':
                        color = 'success';
                        icon = <Done />;
                        text = 'Ticket';
                        break;
                    case 'facturado':
                        color = 'success';
                        icon = <Done />;
                        text = 'Facturado';
                        break;
                    case 'anulado':
                        color = 'error';
                        icon = <Block />;
                        text = 'Anulado';
                        break;
                    case 'orden':
                        color = 'info';
                        icon = <Info />;
                        text = 'Orden';
                        break;
                    case 'presupuesto':
                        color = 'default';
                        icon = null;
                        text = 'Presupuesto';
                        break;
                    default:
                        color = 'default';
                        icon = null;
                        text = params.value;
                }
                return <Chip variant='outlined' label={text} color={color} size='small' icon={icon} />;
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
                        to={`/compras/${params.row.id}`}
                    />,
                    <GridActionsCellItem
                        icon={<Edit />}
                        component={Link}
                        to={`/compras/form/${params.row.id}`}
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
            proveedor: item.nombre_proveedor,
            total: item.total,
            estado: item.estado
        }
    });

    const handleDelete = async (pk) => {
        confirm({
            title: 'Confirmar acción',
            description: '¿Está seguro que desea eliminar la orden de compra?',
            cancellationText: 'Cancelar',
            confirmationText: 'Confirmar'
        })
            .then(() => {
                withLoading(async () => {
                    const url = `${API}/compras-orden/${pk}/delete`;
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
                                message: `Error al eliminar la orden de compra: ${error.message}`,
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
            <PageTitle heading="Compras" />
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
            </Box>
            <div style={{ height: 500, width: '100%' }}>
                <DataGrid
                    loading={loading}
                    columns={columns}
                    rows={rows}
                    disableRowSelectionOnClick
                    rowHeight={30}
                    pageSizeOptions={[50]}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: 50,
                                page: 0
                            }
                        }
                    }}
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    slots={{ toolbar: CustomToolbar }}
                    paginationMode={'server'}
                    rowCount={rowCount}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
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
}
