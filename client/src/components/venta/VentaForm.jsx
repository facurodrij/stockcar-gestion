import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
    Autocomplete,
    Box,
    Button,
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
import SearchIcon from "@mui/icons-material/Search";
import { API } from "../../App";
import ArticuloSelectorDialog from "../shared/ArticuloSelectorDialog";
import SimpleTabPanel from "../shared/SimpleTabPanel";
import SnackbarAlert from "../shared/SnackbarAlert";
import TributoDataGrid from "../tributo/TributoDataGrid";
import fetchWithAuth from '../../utils/fetchWithAuth';
import { useLoading } from '../../utils/loadingContext';


const CustomToolbar = ({ onOpen, onVentaNumberChange }) => {
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
                placeholder="Ej: 0001-00000001"
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={() => onVentaNumberChange(ventaNumber)}
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

export default function VentaForm({ pk }) {
    const {
        handleSubmit,
        control,
        formState: { errors },
        setValue
    } = useForm();
    const [selectOptions, setSelectOptions] = useState({
        cliente: [],
        tipo_comprobante: [],
        tipo_pago: [],
        moneda: [],
        punto_venta: [],
        alicuota_iva: []
    });
    const [tributos, setTributos] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [openArticuloDialog, setOpenArticuloDialog] = useState(false);
    const [selectedArticulo, setSelectedArticulo] = useState([]);
    const [ventaItems, setVentaItems] = useState([]);
    const [selectedTributo, setSelectedTributo] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [estadoVenta, setEstadoVenta] = useState('');
    const { withLoading } = useLoading();

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    }

    const handleCloseSnackbar = (redirect, url = '/ventas') => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = url;
        }
    }

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
                setValue('cliente', data.clientes[0].value); // Seleccionar el primer cliente por defecto
                if (Boolean(pk)) {
                    const venta = data['venta'];
                    const tributos = venta['tributos'];
                    setValue('cliente', venta.cliente);
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
                    setVentaItems(itemsArray);
                    setSelectedArticulo(articuloArray);

                    // Cargar tributos seleccionados
                    setSelectedTributo([])
                    tributos.forEach((t) => {
                        setSelectedTributo(selectedTributo => [...selectedTributo, t]);
                    });
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
    }, [pk, setValue, withLoading]);

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

    const handleVentaNumberChange = async (ventaNumber) => {
        const ventaNumberPattern = /^\d{4}-\d{8}$/;
        try {
            if (!ventaNumber || !ventaNumberPattern.test(ventaNumber)) {
                throw new Error('El número de venta debe tener el formato 0000-00000000');
            }
            const res = await fetchWithAuth(`${API}/ventas/get-items-by-nro/${ventaNumber}`);
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
            setVentaItems(itemsArray);
            setSelectedArticulo(itemsArray.map((r) => r.articulo_id));
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

    return (
        <>
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
                                                field.onChange(value ? value.value : "");
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
                                    defaultValue={dayjs()}
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
                                    editable: true,
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
                                toolbar: () => <CustomToolbar onOpen={setOpenArticuloDialog} onVentaNumberChange={handleVentaNumberChange} />,
                            }}
                            processRowUpdate={(newRow, oldRow) => {
                                const updatedRows = ventaItems.map((row) => {
                                    if (row.articulo_id === oldRow.articulo_id) {
                                        const iva = parseFloat(newRow.alicuota_iva);
                                        newRow.subtotal = newRow.cantidad * newRow.precio_unidad;
                                        newRow.subtotal_iva = newRow.subtotal * iva / (100 + iva);
                                        newRow.subtotal_gravado = newRow.subtotal - newRow.subtotal_iva;
                                        return { ...newRow };
                                    }
                                    return row;
                                });
                                setVentaItems(updatedRows);
                                return newRow;
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
                setItems={setVentaItems}
            />
            <SnackbarAlert
                open={openSnackbar}
                autoHideDuration={snackbar.autoHideDuration}
                onClose={snackbar.onClose}
                severity={snackbar.severity}
                message={snackbar.message}
            />
        </>
    );
}