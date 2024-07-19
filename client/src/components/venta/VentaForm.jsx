import React, {useEffect, useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {
    Autocomplete,
    Box,
    Button,
    FormControl,
    FormHelperText,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Tab,
    Tabs,
    TextField,
    Typography
} from "@mui/material";
import {DateTimePicker, LocalizationProvider} from '@mui/x-date-pickers';
import {DataGrid, GridToolbarContainer} from '@mui/x-data-grid';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import SaveIcon from '@mui/icons-material/Save';
import {API} from "../../App";
import SimpleTabPanel from "../shared/SimpleTabPanel";
import AddIcon from "@mui/icons-material/Add";
import SnackbarAlert from "../shared/SnackbarAlert";
import ArticuloSelectorDialog from "../shared/ArticuloSelectorDialog";
import {esES} from "@mui/x-data-grid/locales";
import InputAdornment from '@mui/material/InputAdornment';

const CustomToolbar = ({onOpen}) => {
    return (
        <GridToolbarContainer>
            <Button
                startIcon={<AddIcon/>}
                size="small"
                variant="contained"
                onClick={() => onOpen(true)}
            >
                Seleccionar Artículos
            </Button>
        </GridToolbarContainer>
    );
}

export default function VentaForm({pk}) {
    const {
        handleSubmit,
        control,
        formState: {errors},
        setValue
    } = useForm();
    const [selectOptions, setSelectOptions] = useState({
        cliente: [],
        tipo_comprobante: [],
        tipo_pago: [],
        moneda: [],
    });
    const [tabValue, setTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        onClose: () => handleCloseSnackbar(false)
    });
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const [openArticuloDialog, setOpenArticuloDialog] = useState(false);
    const [selectedArticulo, setSelectedArticulo] = useState([]);
    const [ventaRenglones, setVentaRenglones] = useState([]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    }

    const handleCloseSnackbar = (redirect) => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = '/ventas';
        }
    }

    const fetchData = async () => {
        const url = Boolean(pk) ? `${API}/ventas/${pk}/update` : `${API}/ventas/create`;
        const res = await fetch(url);
        if (!res.ok) {
            console.error(res);
            const message = Boolean(pk) ? 'Error al obtener la venta' : 'Error al obtener los datos';
            setSnackbar({
                message: message,
                severity: 'error',
                onClose: () => handleCloseSnackbar(true)
            });
            setOpenSnackbar(true);
            return;
        }
        return await res.json();
    }

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchData();
                if (data) {
                    const selectOptions = data['select_options'];
                    setSelectOptions({
                        cliente: selectOptions.cliente,
                        tipo_comprobante: selectOptions.tipo_comprobante,
                        tipo_pago: selectOptions.tipo_pago,
                        moneda: selectOptions.moneda
                    });
                    if (Boolean(pk)) {
                        const venta = data['venta'];
                        setValue('cliente_id', venta.cliente.id);
                        setValue('tipo_comprobante_id', venta.tipo_comprobante.id);
                        setValue('fecha_hora', dayjs(venta.fecha_hora));
                        setValue('descuento', venta.descuento);
                        setValue('recargo', venta.recargo);
                        setValue('tipo_pago_id', venta.tipo_pago.id);
                        setValue('moneda_id', venta.moneda.id);
                        const renglonesArray = data['renglones'].map((r) => {
                            return {
                                articulo_id: r.articulo_id,
                                descripcion: r.descripcion,
                                cantidad: r.cantidad,
                                precio_unidad: r.precio_unidad,
                                subtotal: r.subtotal,
                            };
                        });
                        const articuloArray = renglonesArray.map((r) => r.articulo_id);
                        setVentaRenglones(renglonesArray);
                        setSelectedArticulo(articuloArray);
                    }
                }
            } catch (e) {
                console.error('Error en la carga de datos:', e);
                setSnackbar({
                    message: 'Error al cargar los datos',
                    severity: 'error',
                    onClose: () => handleCloseSnackbar(false)
                });
                setOpenSnackbar(true);
            }
        }

        loadData();
    }, []);

    const onSubmit = async (data) => {
        const url = Boolean(pk) ? `${API}/ventas/${pk}/update` : `${API}/ventas/create`;
        const method = Boolean(pk) ? 'PUT' : 'POST';
        if (ventaRenglones.length === 0) {
            alert('No se ha seleccionado ningún artículo');
            return;
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Accept': 'application/json', // Indica que se espera una respuesta en formato JSON
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({venta: data, renglones: ventaRenglones})
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();
            setSnackbar({
                message: 'Venta guardada correctamente',
                severity: 'success',
                onClose: () => handleCloseSnackbar(true)
                // TODO handleCloseSnackbar(true, responseData['venta_id']) 
            });
            setOpenSnackbar(true);
        } catch (e) {
            console.error('Error al guardar la venta:', e);
            setSnackbar({
                message: 'Error al guardar la venta',
                severity: 'error',
                onClose: () => handleCloseSnackbar(false)
            });
            setOpenSnackbar(true);
        }
    }

    const onError = (errors) => {
        alert(JSON.stringify(errors));
        // TODO Mostrar errores
    }

    return (
        <>
            <Paper elevation={3} component="form" onSubmit={handleSubmit(onSubmit, onError)} noValidate
                   sx={{mt: 2, padding: 2}}>
                <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                    <Tabs value={tabValue} onChange={handleTabChange} centered>
                        <Tab label="Principal"/>
                        <Tab label="Configuración"/>
                        <Tab label="Factura Electrónica"/>
                    </Tabs>
                </Box>
                <SimpleTabPanel value={tabValue} index={0}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <Controller
                                    name="cliente_id"
                                    control={control}
                                    defaultValue=""
                                    rules={{required: "Este campo es requerido"}}
                                    render={({field}) => (
                                        <Autocomplete
                                            {...field}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    required
                                                    label="Seleccionar Cliente"
                                                    variant="outlined"
                                                    error={Boolean(errors.cliente_id)}
                                                    helperText={errors.cliente_id && errors.cliente_id.message}
                                                />
                                            )}
                                            options={selectOptions.cliente}
                                            getOptionLabel={(option) => option.razon_social ? option.razon_social : ''}
                                            getOptionKey={(option) => option.id}
                                            value={selectOptions.cliente.find((c) => c.id === field.value) || ""}
                                            isOptionEqualToValue={(option, value) =>
                                                value === undefined || value === "" || option.id === value.id
                                            }
                                            onChange={(event, value) => {
                                                field.onChange(value ? value.id : null);
                                            }}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                    <br/>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <FormControl fullWidth required error={Boolean(errors.tipo_comprobante_id)}>
                                <InputLabel id="tipo_comprobante_label">Tipo de Comprobante</InputLabel>
                                <Controller
                                    name="tipo_comprobante_id"
                                    control={control}
                                    defaultValue=""
                                    rules={{required: "Este campo es requerido"}}
                                    render={({field}) => (
                                        <Select
                                            {...field}
                                            id="tipo_comprobante"
                                            labelId="tipo_comprobante_label"
                                            label="Tipo de Comprobante"
                                        >
                                            {selectOptions.tipo_comprobante.map((item) => (
                                                <MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
                                        </Select>
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth error={Boolean(errors.fecha_hora)}>
                                <Controller
                                    name="fecha_hora"
                                    control={control}
                                    defaultValue={dayjs()}
                                    render={({field}) => (
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
                    <Typography variant="h6" gutterBottom sx={{mt: 3}}>Renglones de Venta</Typography>
                    <div style={{height: 500, width: '100%'}}>
                        <DataGrid
                            columns={[
                                {field: 'descripcion', headerName: 'Descripción', flex: 2, editable: true},
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
                                    }
                                },
                            ]}
                            rows={ventaRenglones}
                            getRowId={(row) => row.articulo_id}
                            disableSelectionOnClick
                            slots={{
                                toolbar: () => <CustomToolbar onOpen={setOpenArticuloDialog}/>,
                            }}
                            processRowUpdate={(newRow, oldRow) => {
                                const updatedRows = ventaRenglones.map((row) => {
                                    if (row.articulo_id === oldRow.articulo_id) {
                                        newRow.subtotal = newRow.cantidad * newRow.precio_unidad;
                                        return {...newRow};
                                    }
                                    return row;
                                });
                                setVentaRenglones(updatedRows);
                                return newRow;
                            }}
                            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                        />
                    </div>
                </SimpleTabPanel>
                <SimpleTabPanel value={tabValue} index={1}>
                    <Grid container spacing={2}>
                        {/* TODO Agregar campos de configuracion, iva, tributos, puntos de venta, descuento, recargo */}
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <Controller
                                    name="descuento"
                                    control={control}
                                    defaultValue=""
                                    render={({field}) => (
                                        <TextField
                                            {...field}
                                            label="Descuento"
                                            variant="outlined"
                                            type='number'
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">%</InputAdornment>
                                            }}
                                            error={Boolean(errors.descuento)}
                                            helperText={errors.descuento && errors.descuento.message}
                                        />
                                    )}
                                />
                            </FormControl>    
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <Controller
                                    name="recargo"
                                    control={control}
                                    defaultValue=""
                                    render={({field}) => (
                                        <TextField
                                            {...field}
                                            label="Recargo"
                                            variant="outlined"
                                            type='number'
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">%</InputAdornment>
                                            }}
                                            error={Boolean(errors.recargo)}
                                            helperText={errors.recargo && errors.recargo.message}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel id="tipo_pago_label">Tipo de Pago</InputLabel>
                                <Controller
                                    name="tipo_pago_id"
                                    control={control}
                                    defaultValue=""
                                    render={({field}) => (
                                        <Select
                                            {...field}
                                            id="tipo_pago"
                                            labelId="tipo_pago_label"
                                            label="Tipo de Pago"
                                        >
                                            {selectOptions.tipo_pago.map((item) => (
                                                <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>))}
                                        </Select>
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel id="moneda_label">Moneda</InputLabel>
                                <Controller
                                    name="moneda_id"
                                    control={control}
                                    defaultValue=""
                                    render={({field}) => (
                                        <Select
                                            {...field}
                                            id="moneda"
                                            labelId="moneda_label"
                                            label="Moneda"
                                        >
                                            {selectOptions.moneda.map((item) => (
                                                <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>))}
                                        </Select>
                                    )}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                </SimpleTabPanel>
                <SimpleTabPanel value={tabValue} index={2}>
                    {/* TODO Agregar campos de factura electronica */}
                </SimpleTabPanel>
                <Box sx={{borderTop: 1, borderColor: 'divider'}}>
                    <Box sx={{p: 3}}>
                        <Typography variant="h6" gutterBottom>Totales</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography>Total de Artículos: {ventaRenglones.reduce((acc, row) => acc + Number(row.cantidad), 0)}</Typography>
                                <Typography>Porcentaje de IVA: 21%</Typography>
                                <Typography fontWeight={700}>Total a Pagar: {ventaRenglones.reduce((acc, row) => acc + Number(row.subtotal), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                {/* Espacio reservado para futuras expansiones o información adicional */}
                            </Grid>
                        </Grid>
                    </Box>
                    <Box sx={{display: 'flex', justifyContent: 'right', mt: 2}}>
                        <Button variant="contained" startIcon={<SaveIcon/>} type="submit">
                            Guardar
                        </Button>
                    </Box>
                </Box>
            </Paper>
            <ArticuloSelectorDialog
                open={openArticuloDialog}
                onClose={() => setOpenArticuloDialog(false)}
                selectedArticulo={selectedArticulo}
                setSelectedArticulo={setSelectedArticulo}
                renglones={ventaRenglones}
                setRenglones={setVentaRenglones}
            />
            <SnackbarAlert
                open={openSnackbar}
                autoHideDuration={4000}
                onClose={snackbar.onClose}
                severity={snackbar.severity}
                message={snackbar.message}
            />
        </>
    );
}