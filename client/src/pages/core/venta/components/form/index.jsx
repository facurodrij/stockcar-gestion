import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    FormHelperText,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Tab,
    Tabs,
    TextField,
    Typography
} from "@mui/material";
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import { esES } from "@mui/x-data-grid/locales";
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from '@mui/icons-material/Search';
import { API } from '../../../../../App';
import ArticuloSelectorDialog from '../../../../../common/components/ArticuloSelectorDialog';
import SimpleTabPanel from '../../../../../common/components/SimpleTabPanel';
import SnackbarAlert from '../../../../../common/components/SnackbarAlert';
import TributoDataGrid from '../../../../../common/components/TributoDataGrid';
import fetchWithAuth from '../../../../../config/auth/fetchWithAuth';
import { useLoading } from '../../../../../common/contexts/LoadingContext';
import checkPermissions from '../../../../../config/auth/checkPermissions';
import PageTitle from '../../../../../common/components/PageTitle';

const CustomToolbar = ({ onOpen, fetchVentaItems }) => {
    const [ventaNumber, setVentaNumber] = useState('');

    return (
        <GridToolbarContainer sx={{ borderBottom: 1, borderColor: 'divider', pb: .5, display: 'flex', justifyContent: 'space-between' }}>
            <Button
                color='primary'
                startIcon={<AddIcon />}
                onClick={() => onOpen(true)}
            >
                Seleccionar Artículos
            </Button>
            <TextField
                label="Cargar Items desde Venta"
                variant="outlined"
                size="small"
                value={ventaNumber}
                onChange={(e) => setVentaNumber(e.target.value)}
                placeholder="0001-00000001 o ID"
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={() => fetchVentaItems(ventaNumber)}
                                edge="end"
                                color="primary"
                            >
                                <SearchIcon />
                            </IconButton>
                        </InputAdornment>
                    )
                }}
            />
        </GridToolbarContainer>
    );
}

export default function VentaForm({ permissions }) {
    const pk = useParams().pk
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const itemsByVentaId = queryParams.get('itemsByVentaId');
    const {
        handleSubmit,
        control,
        formState: { errors },
        setValue
    } = useForm();
    const [estadoVenta, setEstadoVenta] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newItems, setNewItems] = useState([]);
    const [openArticuloDialog, setOpenArticuloDialog] = useState(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [selectedArticulo, setSelectedArticulo] = useState([]);
    const [selectedTributo, setSelectedTributo] = useState([]);
    const [selectOptions, setSelectOptions] = useState({
        cliente: [],
        tipo_comprobante: [],
        tipo_pago: [],
        moneda: [],
        punto_venta: [],
        alicuota_iva: []
    });
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const [tabValue, setTabValue] = useState(0);
    const [tributos, setTributos] = useState([]);
    const [ventaItems, setVentaItems] = useState([]);
    const [isClienteExento, setIsClienteExento] = useState(false);
    const { withLoading } = useLoading();
    const hasFetchedItems = useRef(false);
    const ivaSnapshotRef = useRef(new Map());
    const [alertMessage, setAlertMessage] = useState('');

    const isClienteOptionExento = (clienteOption) => clienteOption?.tipo_responsable_abreviatura === 'E';

    const recalcularItem = (item, ivaObjetivo = item.alicuota_iva) => {
        const cantidad = Number(item.cantidad) || 0;
        const precioUnidad = Number(item.precio_unidad) || 0;
        const iva = Number(ivaObjetivo) || 0;
        const subtotal = cantidad * precioUnidad;
        const subtotalIva = iva === 0 ? 0 : subtotal * iva / (100 + iva);
        const subtotalGravado = subtotal - subtotalIva;

        return {
            ...item,
            alicuota_iva: iva,
            subtotal_iva: subtotalIva,
            subtotal_gravado: subtotalGravado,
            subtotal
        };
    };

    const forzarIvaCero = (items = []) => {
        return items.map((item) => {
            const articuloId = item.articulo_id;
            if (!ivaSnapshotRef.current.has(articuloId)) {
                ivaSnapshotRef.current.set(articuloId, Number(item.alicuota_iva) || 0);
            }
            return recalcularItem(item, 0);
        });
    };

    const restaurarIvaPrevio = (items = []) => {
        return items.map((item) => {
            const articuloId = item.articulo_id;
            if (!ivaSnapshotRef.current.has(articuloId)) {
                return item;
            }
            const ivaPrevio = ivaSnapshotRef.current.get(articuloId);
            return recalcularItem(item, ivaPrevio);
        });
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    }

    const handleCloseSnackbar = (redirect, url = '/ventas') => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = url;
        }
    }

    const handleConfirmDialogClose = (replace) => {
        if (replace) {
            setVentaItems((prevItems) => {
                const updatedItems = [...prevItems];
                newItems.forEach((newItem) => {
                    const index = updatedItems.findIndex(item => item.articulo_id === newItem.articulo_id);
                    if (index !== -1) {
                        updatedItems[index] = newItem;
                    } else {
                        updatedItems.push(newItem);
                    }
                });
                return isClienteExento ? forzarIvaCero(updatedItems) : updatedItems;
            });
            setSelectedArticulo((prevArticulos) => {
                const newArticulos = newItems.map((r) => r.articulo_id);
                return [...new Set([...prevArticulos, ...newArticulos])];
            });
        }
        setOpenConfirmDialog(false);
        setNewItems([]);
    }

    const fetchVentaItems = async (ventaNumber, enforceExento = isClienteExento) => {
        const ventaNumberPattern = /^\d{4}-\d{8}$/;
        const ventaIdPattern = /^\d+$/;
        try {
            let url;
            if (ventaNumberPattern.test(ventaNumber)) {
                url = `${API}/ventas/get-items-by-nro/${ventaNumber}`;
            } else if (ventaIdPattern.test(ventaNumber)) {
                url = `${API}/ventas/get-items-by-id/${ventaNumber}`;
            } else {
                throw new Error('El número de venta debe tener el formato 0000-00000000 o ser un ID numérico');
            }
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error);
            }
            const itemsArray = data.items.map((r) => ({
                articulo_id: r.articulo_id,
                descripcion: r.descripcion,
                cantidad: r.cantidad,
                precio_unidad: r.precio_unidad,
                alicuota_iva: r.alicuota_iva,
                subtotal_iva: r.subtotal_iva,
                subtotal_gravado: r.subtotal_gravado,
                subtotal: r.subtotal,
            }));
            const normalizedItemsArray = enforceExento ? forzarIvaCero(itemsArray) : itemsArray;

            const existingItems = normalizedItemsArray.filter(newItem => ventaItems.some(item => item.articulo_id === newItem.articulo_id));
            if (existingItems.length > 0) {
                setNewItems(normalizedItemsArray);
                setOpenConfirmDialog(true);
            } else {
                setVentaItems((prevItems) => [...prevItems, ...normalizedItemsArray]);
                setSelectedArticulo((prevArticulos) => [...prevArticulos, ...normalizedItemsArray.map((r) => r.articulo_id)]);
            }
        } catch (e) {
            console.error('Error al obtener la venta:', e);
            setSnackbar({
                message: e.message,
                severity: 'error',
                autoHideDuration: null,
                onClose: () => handleCloseSnackbar(false)
            });
            setOpenSnackbar(true);
        }
    }

    useEffect(() => {
        checkPermissions(permissions);
    }, [permissions]);

    useEffect(() => {
        const fetchData = async () => {
            const url = Boolean(pk) ? `${API}/ventas/${pk}/update` : `${API}/ventas/create`;
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                const message = `Error al obtener datos: ${data['error']}`
                throw new Error(message);
            }
            return data;
        }
        const loadData = async () => {
            try {
                const data = await fetchData();
                setSelectOptions({
                    cliente: data.clientes,
                    tipo_comprobante: data.tipo_comprobante,
                    tipo_pago: data.tipo_pago,
                    moneda: data.moneda,
                    punto_venta: data.punto_venta,
                    alicuota_iva: data.alicuota_iva
                });
                setTributos(data.tributos);
                let selectedClienteId = data.clientes[0]?.value || "";
                if (Boolean(pk)) {
                    const venta = data['venta'];
                    const tributos = venta['tributos'];
                    selectedClienteId = venta.cliente;
                    setValue('tipo_comprobante', venta.tipo_comprobante);
                    setValue('punto_venta', venta.punto_venta);
                    setValue('tipo_pago', venta.tipo_pago);
                    setValue('moneda', venta.moneda);
                    setValue('fecha_hora', dayjs(venta.fecha_hora));
                    setValue('moneda_cotizacion', venta.moneda_cotizacion);
                    if (venta.cae) setValue('cae', venta.cae);
                    if (venta.vencimiento_cae) setValue('vencimiento_cae', dayjs(venta.vencimiento_cae));
                    if (venta.observacion) setValue('observacion', venta.observacion);
                    setEstadoVenta(venta.estado);

                    // Cargar items de venta
                    const itemsArray = venta['items'].map((r) => {
                        return {
                            articulo_id: r.articulo_id,
                            descripcion: r.descripcion,
                            cantidad: r.cantidad,
                            precio_unidad: r.precio_unidad,
                            alicuota_iva: r.alicuota_iva,
                            subtotal_iva: r.subtotal_iva,
                            subtotal_gravado: r.subtotal_gravado,
                            subtotal: r.subtotal,
                        };
                    });
                    const articuloArray = itemsArray.map((r) => r.articulo_id);
                    const clienteSeleccionado = data.clientes.find((c) => c.value === selectedClienteId);
                    const clienteEsExento = isClienteOptionExento(clienteSeleccionado);
                    setIsClienteExento(clienteEsExento);
                    if (!clienteEsExento) {
                        ivaSnapshotRef.current.clear();
                    }
                    setVentaItems(clienteEsExento ? forzarIvaCero(itemsArray) : itemsArray);
                    setSelectedArticulo(articuloArray);

                    // Cargar tributos seleccionados
                    setSelectedTributo([])
                    tributos.forEach((t) => {
                        setSelectedTributo(selectedTributo => [...selectedTributo, t]);
                    });
                } else {
                    const clienteSeleccionado = data.clientes.find((c) => c.value === selectedClienteId);
                    const clienteEsExento = isClienteOptionExento(clienteSeleccionado);
                    setIsClienteExento(clienteEsExento);
                    if (!clienteEsExento) {
                        ivaSnapshotRef.current.clear();
                    }
                }
                setValue('cliente', selectedClienteId);
                if (Boolean(itemsByVentaId) && !hasFetchedItems.current) {
                    fetchVentaItems(itemsByVentaId, isClienteOptionExento(data.clientes.find((c) => c.value === selectedClienteId)));
                    hasFetchedItems.current = true;
                }
            } catch (e) {
                console.error('Error en la carga de datos:', e);
                setSnackbar({
                    message: e.message,
                    severity: 'error',
                    autoHideDuration: null,
                    onClose: () => handleCloseSnackbar(false)
                });
                setOpenSnackbar(true);
            }
        }

        withLoading(loadData);
    }, []);


    const onSubmit = async (data) => {
        setIsSubmitting(true);
        const url = Boolean(pk) ? `${API}/ventas/${pk}/update` : `${API}/ventas/create`;
        const method = Boolean(pk) ? 'PUT' : 'POST';
        try {
            if (ventaItems.length === 0) {
                throw new Error('No se ha seleccionado ningún artículo');
            }
            data['items'] = ventaItems;
            data['tributos'] = selectedTributo;
            const res = await fetchWithAuth(url, method, data);
            const resJson = await res.json();
            if (!res.ok) {
                if (res.status === 409) {
                    throw new Error(JSON.stringify(resJson));
                }
                throw new Error(resJson['error']);
            }
            setSnackbar({
                message: 'Venta guardada correctamente',
                severity: 'success',
                autoHideDuration: 4000,
                onClose: () => handleCloseSnackbar(true, `/ventas/${resJson['venta_id']}`)
            });
        } catch (e) {
            console.error('Error al guardar la venta:', e);
            setSnackbar({
                message: e.message,
                severity: 'error',
                autoHideDuration: null,
                onClose: () => handleCloseSnackbar(false)
            });
            setIsSubmitting(false);
        } finally {
            setOpenSnackbar(true);
        }
    }

    const onError = (errors) => {
        if (errors['cliente'] || errors['tipo_comprobante'] || errors['fecha_hora']) {
            setTabValue(0);
            return;
        }
        if (errors['descuento'] || errors['recargo'] || errors['tipo_pago'] || errors['moneda']) {
            setTabValue(1);
        }
    }

    const calculateTotalTributos = () => {
        let totalTributos = 0
        tributos.filter((t) => selectedTributo.includes(t.id)).forEach((t) => {
            if (t.base_calculo === 'Neto')
                totalTributos += ventaItems.reduce((acc, row) => acc + Number(row.subtotal_gravado), 0) * t.alicuota / 100;
            else
                totalTributos += ventaItems.reduce((acc, row) => acc + Number(row.subtotal), 0) * t.alicuota / 100;
        });
        return totalTributos
    }

    const handleTipoComprobanteChange = (value) => {
        const selectedComprobante = selectOptions.tipo_comprobante.find(item => item.value === value);
        if (selectedComprobante && !selectedComprobante.descontar_stock) {
            setAlertMessage(`El tipo de comprobante "${selectedComprobante.label}" no descontará stock de los artículos seleccionados.`);
        } else {
            setAlertMessage('');
        }
        setValue('tipo_comprobante', value);
    };

    return (
        <>
            <PageTitle heading={Boolean(pk) ? 'Editar Venta' : 'Agregar Venta'} />
            <Paper elevation={3} component="form" onSubmit={handleSubmit(onSubmit, onError)} noValidate
                sx={{ mt: 2, padding: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', justifyContent: 'center', display: 'flex' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons
                        allowScrollButtonsMobile
                        aria-label="scrollable force tabs"
                    >
                        <Tab label="Principal" />
                        <Tab label="Configuración" />
                        <Tab label="Factura Electrónica" />
                        <Tab label="Observaciones" />
                    </Tabs>
                </Box>
                <SimpleTabPanel value={tabValue} index={0}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <Controller
                                    name="cliente"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <Autocomplete
                                            {...field}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    required
                                                    label="Seleccionar Cliente"
                                                    variant="outlined"
                                                    error={Boolean(errors.cliente)}
                                                    helperText={errors.cliente && errors.cliente.message}
                                                />
                                            )}
                                            options={selectOptions.cliente}
                                            getOptionLabel={(option) => option.label ? option.label : ''}
                                            getOptionKey={(option) => option.value}
                                            value={selectOptions.cliente.find((c) => c.value === field.value) || ""}
                                            isOptionEqualToValue={(option, value) =>
                                                value === undefined || value === "" || option.value === value.value
                                            }
                                            onChange={(event, value) => {
                                                const clienteValue = value ? value.value : "";
                                                const nextIsClienteExento = isClienteOptionExento(value);
                                                field.onChange(clienteValue);

                                                if (nextIsClienteExento === isClienteExento) {
                                                    return;
                                                }

                                                setIsClienteExento(nextIsClienteExento);
                                                if (nextIsClienteExento) {
                                                    setVentaItems(forzarIvaCero(ventaItems));
                                                    setNewItems(forzarIvaCero(newItems));
                                                    return;
                                                }

                                                setVentaItems(restaurarIvaPrevio(ventaItems));
                                                setNewItems(restaurarIvaPrevio(newItems));
                                                ivaSnapshotRef.current.clear();
                                            }}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth required error={Boolean(errors.punto_venta)}>
                                <InputLabel id="punto_venta_label">Punto de Venta</InputLabel>
                                <Controller
                                    name="punto_venta"
                                    control={control}
                                    defaultValue="1"
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            id="punto_venta"
                                            labelId="punto_venta_label"
                                            label="Punto de Venta"
                                        >
                                            {selectOptions.punto_venta.map((item) => (
                                                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>))}
                                        </Select>
                                    )}
                                />
                                <FormHelperText>{errors.punto_venta && errors.punto_venta.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <br />
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <FormControl fullWidth required error={Boolean(errors.tipo_comprobante)}>
                                <InputLabel id="tipo_comprobante_label">Tipo de Comprobante</InputLabel>
                                <Controller
                                    name="tipo_comprobante"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            id="tipo_comprobante"
                                            labelId="tipo_comprobante_label"
                                            label="Tipo de Comprobante"
                                            onChange={(event) => handleTipoComprobanteChange(event.target.value)}
                                        >
                                            {selectOptions.tipo_comprobante.map((item) => (
                                                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>))}
                                        </Select>
                                    )}
                                />
                                <FormHelperText>{errors.tipo_comprobante && errors.tipo_comprobante.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth error={Boolean(errors.fecha_hora)}>
                                <Controller
                                    name="fecha_hora"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'es'}>
                                            <DateTimePicker
                                                {...field}
                                                label="Fecha de Emisión"
                                                value={field.value ? dayjs(field.value) : null}
                                                onChange={(value) => field.onChange(value)}
                                            />
                                        </LocalizationProvider>
                                    )}
                                />
                                <FormHelperText>{errors.fecha_hora && errors.fecha_hora.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                    </Grid>
                    {alertMessage && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            {alertMessage}
                        </Alert>
                    )}
                    {isClienteExento && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Cliente con condicion IVA Sujeto Exento: el IVA de todos los items se aplica automaticamente en 0%.
                        </Alert>
                    )}
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Items de Venta</Typography>
                    <Box sx={{
                        height: 500,
                        width: '100%',
                        '& .font-weight-bold': { fontWeight: '700' },
                        '& .disabled-cell': { backgroundColor: '#f5f5f5' }
                    }}
                    >
                        <DataGrid
                            columns={[
                                {
                                    field: 'descripcion',
                                    headerName: 'Descripción',
                                    flex: 2,
                                    editable: true,
                                    valueFormatter: (value) => {
                                        return value.length > 30 ? `${value.substring(0, 30)}...` : value;
                                    }
                                },
                                {
                                    field: 'cantidad',
                                    headerName: 'Cantidad',
                                    flex: 0.5,
                                    type: 'number',
                                    editable: true,
                                    valueFormatter: (value) => {
                                        return new Intl.NumberFormat('es-AR').format(value);
                                    }
                                },
                                {
                                    field: 'precio_unidad',
                                    headerName: 'Precio x Unidad',
                                    flex: 0.5,
                                    type: 'number',
                                    editable: true,
                                    valueFormatter: (value) => {
                                        return new Intl.NumberFormat('es-AR', {
                                            style: 'currency',
                                            currency: 'ARS'
                                        }).format(value);
                                    }
                                },
                                {
                                    field: 'alicuota_iva',
                                    headerName: 'IVA (%)',
                                    flex: 0.5,
                                    type: 'singleSelect',
                                    editable: !isClienteExento,
                                    valueOptions: selectOptions.alicuota_iva.map((item) => (
                                        { value: item.value, label: `${item.label}%` }
                                    )),
                                    valueFormatter: (value) => {
                                        return new Intl.NumberFormat('es-AR').format(value);
                                    }
                                },
                                {
                                    field: 'subtotal_iva',
                                    headerName: 'Importe IVA',
                                    flex: 0.5,
                                    type: 'number',
                                    editable: false,
                                    valueFormatter: (value) => {
                                        return new Intl.NumberFormat('es-AR', {
                                            style: 'currency',
                                            currency: 'ARS'
                                        }).format(value);
                                    },
                                    cellClassName: () => 'disabled-cell'
                                },
                                {
                                    field: 'subtotal_gravado',
                                    headerName: 'Importe Gravado',
                                    flex: 0.5,
                                    type: 'number',
                                    editable: false,
                                    valueFormatter: (value) => {
                                        return new Intl.NumberFormat('es-AR', {
                                            style: 'currency',
                                            currency: 'ARS'
                                        }).format(value);
                                    },
                                    cellClassName: () => 'disabled-cell'
                                },
                                {
                                    field: 'subtotal',
                                    headerName: 'Subtotales',
                                    flex: 0.5,
                                    type: 'number',
                                    editable: false,
                                    valueFormatter: (value) => {
                                        return new Intl.NumberFormat('es-AR', {
                                            style: 'currency',
                                            currency: 'ARS'
                                        }).format(value);
                                    },
                                    cellClassName: () => {
                                        return 'font-weight-bold disabled-cell';
                                    }
                                },
                            ]}
                            rows={ventaItems}
                            getRowId={(row) => row.articulo_id}
                            disableRowSelectionOnClick
                            slots={{
                                toolbar: () => <CustomToolbar onOpen={setOpenArticuloDialog} fetchVentaItems={fetchVentaItems} />
                            }}
                            processRowUpdate={(newRow, oldRow) => {
                                const updatedRows = ventaItems.map((row) => {
                                    if (row.articulo_id === oldRow.articulo_id) {
                                        return recalcularItem(newRow, isClienteExento ? 0 : newRow.alicuota_iva);
                                    }
                                    return row;
                                });
                                setVentaItems(updatedRows);
                                return updatedRows.find((row) => row.articulo_id === oldRow.articulo_id);
                            }}
                            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                        />
                    </Box>
                </SimpleTabPanel>
                <SimpleTabPanel value={tabValue} index={1}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel id="moneda_label">Moneda</InputLabel>
                                <Controller
                                    name="moneda"
                                    control={control}
                                    defaultValue="1"
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            id="moneda"
                                            labelId="moneda_label"
                                            label="Moneda"
                                        >
                                            {selectOptions.moneda.map((item) => (
                                                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>))}
                                        </Select>
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <Controller
                                    name="moneda_cotizacion"
                                    control={control}
                                    defaultValue="1"
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Cotización"
                                            variant="outlined"
                                            type='number'
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">$</InputAdornment>
                                            }}
                                            error={Boolean(errors.moneda_cotizacion)}
                                            helperText={errors.moneda_cotizacion
                                                ? errors.moneda_cotizacion.message
                                                : '1 si la moneda es ARS, caso contrario ingresar la cotización respecto al peso argentino'
                                            }
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel id="tipo_pago_label">Tipo de Pago</InputLabel>
                                <Controller
                                    name="tipo_pago"
                                    control={control}
                                    defaultValue="1"
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            id="tipo_pago"
                                            labelId="tipo_pago_label"
                                            label="Tipo de Pago"
                                        >
                                            {selectOptions.tipo_pago.map((item) => (
                                                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>))}
                                        </Select>
                                    )}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Tributos adicionales</Typography>
                    {/* TODO Actualizar tributos al cambiar de Cliente y Comprobante */}
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TributoDataGrid
                                tributos={tributos}
                                selectedTributo={selectedTributo}
                                setSelectedTributo={setSelectedTributo}
                            />
                        </Grid>
                    </Grid>
                </SimpleTabPanel>
                <SimpleTabPanel value={tabValue} index={2}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <Controller
                                    name="cae"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="CAE"
                                            variant="outlined"
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth error={Boolean(errors.vencimiento_cae)}>
                                <Controller
                                    name="vencimiento_cae"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'es'}>
                                            <DateTimePicker
                                                {...field}
                                                label="Vencimiento de CAE"
                                                value={field.value ? dayjs(field.value) : null}
                                                onChange={(value) => field.onChange(value)}
                                            />
                                        </LocalizationProvider>
                                    )}
                                />
                                <FormHelperText>{errors.vencimiento_cae && errors.vencimiento_cae.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                    </Grid>
                </SimpleTabPanel>
                <SimpleTabPanel value={tabValue} index={3}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    name="observacion"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            id="observacion"
                                            label="Observaciones"
                                            variant="outlined"
                                            multiline
                                            rows={6}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                </SimpleTabPanel>
                <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Totales</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography>Artículos: {ventaItems.reduce((acc, row) => acc + Number(row.cantidad), 0)}</Typography>
                                <Typography>Importe de IVA: {ventaItems.reduce((acc, row) => acc + Number(row.subtotal_iva), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</Typography>
                                <Typography>Importe Gravado: {ventaItems.reduce((acc, row) => acc + Number(row.subtotal_gravado), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</Typography>
                                <Typography>Descuento:</Typography>
                                <Typography>Recargo:</Typography>
                                <Typography>Importe Otros Tributos: {calculateTotalTributos().toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</Typography>
                                <Typography fontWeight={700}>Importe Total: {(ventaItems.reduce((acc, row) => acc + Number(row.subtotal), 0) + calculateTotalTributos()).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                {/* Espacio reservado para futuras expansiones o información adicional */}
                            </Grid>
                        </Grid>
                    </Box>
                    <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'right', mt: 2 }}>
                            {estadoVenta === 'orden' ? (
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    type="button"
                                    onClick={handleSubmit(onSubmit, onError)}
                                    disabled={isSubmitting}
                                >
                                    Facturar Orden y Guardar
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    type="button"
                                    onClick={handleSubmit(onSubmit, onError)}
                                    disabled={isSubmitting}
                                >
                                    Guardar
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Paper >
            <ArticuloSelectorDialog
                open={openArticuloDialog}
                onClose={() => setOpenArticuloDialog(false)}
                selectedArticulo={selectedArticulo}
                setSelectedArticulo={setSelectedArticulo}
                items={ventaItems}
                setItems={(itemsOrUpdater) => {
                    setVentaItems((prevItems) => {
                        const resolvedItems = typeof itemsOrUpdater === 'function'
                            ? itemsOrUpdater(prevItems)
                            : itemsOrUpdater;
                        return isClienteExento ? forzarIvaCero(resolvedItems) : resolvedItems;
                    });
                }}
            />
            <SnackbarAlert
                open={openSnackbar}
                autoHideDuration={snackbar.autoHideDuration}
                onClose={snackbar.onClose}
                severity={snackbar.severity}
                message={snackbar.message}
            />
            <Dialog
                open={openConfirmDialog}
                onClose={() => handleConfirmDialogClose(false)}
            >
                <DialogTitle>Confirmar Reemplazo</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Algunos artículos ya existen en la lista. ¿Desea reemplazarlos?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleConfirmDialogClose(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={() => handleConfirmDialogClose(true)} color="primary" autoFocus>
                        Reemplazar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

