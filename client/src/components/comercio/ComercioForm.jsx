import React, { useEffect, useState } from 'react';
import { Controller, set, useForm } from 'react-hook-form';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    FormLabel,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Tab,
    Tabs,
    TextField,
    Typography
} from "@mui/material";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import SaveIcon from '@mui/icons-material/Save';
import SimpleTabPanel from "../shared/SimpleTabPanel";
import { API } from "../../App";
import SnackbarAlert from "../shared/SnackbarAlert";
import PuntoVentaDataGrid from "./PuntoVentaDataGrid";


export default function ComercioForm({ pk }) {
    const {
        handleSubmit,
        control,
        formState: { errors },
        setValue
    } = useForm();
    const [selectOptions, setSelectOptions] = useState({
        cuit: [],
        tipo_responsable: [],
        provincia: []
    });
    const [tabValue, setTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [puntoVenta, setPuntoVenta] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    }

    const handleCloseSnackbar = (redirect) => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = '/comercios';
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            const url = Boolean(pk) ? `${API}/comercios/${pk}/update` : `${API}/comercios/create`;
            const res = await fetch(url);
            if (!res.ok) {
                const message = Boolean(pk) ? 'Error al obtener los datos del comercio' : 'Error al obtener los datos';
                throw new Error(message);
            }
            return await res.json();
        }
        const loadData = async () => {
            try {
                const data = await fetchData();
                const selectOptions = data['select_options'];
                setSelectOptions({
                    tipo_responsable: selectOptions.tipo_responsable,
                    provincia: selectOptions.provincia
                });
                if (Boolean(pk)) {
                    const comercio = data['comercio'];
                    setValue('tipo_responsable_id', comercio.tipo_responsable.id);
                    setValue('razon_social', comercio.razon_social);
                    setValue('cuit', comercio.cuit);
                    setValue('ingresos_brutos', comercio.ingresos_brutos);
                    setValue('nombre_fantasia', comercio.nombre_fantasia);
                    setValue('inicio_actividades', dayjs(comercio.inicio_actividades));
                    setValue('direccion', comercio.direccion);
                    setValue('localidad', comercio.localidad);
                    setValue('codigo_postal', comercio.codigo_postal);
                    setValue('provincia_id', comercio.provincia.id);
                    if (comercio.telefono) setValue('telefono', comercio.telefono);
                    if (comercio.email) setValue('email', comercio.email);
                    if (comercio.observacion) setValue('observacion', comercio.observacion);
                    // Cargar puntos de venta
                    const puntoVentaArray = data['puntos_venta'].map((r) => {
                        return {
                            id: r.id,
                            numero: r.numero,
                            nombre_fantasia: r.nombre_fantasia,
                            domicilio: r.domicilio
                        };
                    });
                    setPuntoVenta(puntoVentaArray);
                }
            }
            catch (e) {
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
    }, [pk, setValue]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        const url = Boolean(pk) ? `${API}/comercios/${pk}/update` : `${API}/comercios/create`;
        const method = Boolean(pk) ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comercio: data, puntos_venta: puntoVenta })
            });
            const responseJson = await response.json();
            if (!response.ok) {
                throw new Error(`${responseJson['error']}`);
            }
            setSnackbar({
                message: 'Datos guardados correctamente',
                severity: 'success',
                autoHideDuration: 4000,
                onClose: () => handleCloseSnackbar(true)
            });
        } catch (e) {
            console.error('Error en la carga de datos:', e);
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
        if (errors['tipo_responsable_id'] || errors['razon_social'] || errors['cuit'] || errors['ingresos_brutos'] || errors['inicio_actividades'] ||
            errors['direccion'] || errors['localidad'] || errors['codigo_postal'] || errors['provincia_id'] || errors['email']) {
            setTabValue(0);
            return;
        }
    }

    return (
        <>
            <Paper elevation={3} component="form" onSubmit={handleSubmit(onSubmit, onError)} noValidate
                sx={{ mt: 2, padding: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} centered>
                        <Tab label="Principal" />
                        <Tab label="Puntos de Venta" />
                        <Tab label="Observaciones" />
                    </Tabs>
                </Box>
                <SimpleTabPanel value={tabValue} index={0}>
                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <FormControl fullWidth required error={Boolean(errors.tipo_responsable_id)}>
                                <InputLabel id="tipo_responsable_label">Tipo de Responsable IVA</InputLabel>
                                <Controller
                                    name="tipo_responsable_id"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            id="tipo_responsable"
                                            labelId="tipo_responsable_label"
                                            label="Tipo de Responsable IVA"
                                        >
                                            {selectOptions.tipo_responsable.map((item) => (
                                                <MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
                                        </Select>
                                    )}
                                />
                                <FormHelperText>{errors.tipo_responsable_id && errors.tipo_responsable_id.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                        <Grid item xs={8}>
                            <FormControl fullWidth>
                                <Controller
                                    name="razon_social"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            required
                                            id="razon_social"
                                            label="Razón Social"
                                            variant="outlined"
                                            error={Boolean(errors.razon_social)}
                                            helperText={errors.razon_social && errors.razon_social.message}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <Controller
                                    name="cuit"
                                    control={control}
                                    defaultValue=""
                                    rules={{
                                        required: "Este campo es requerido",
                                        pattern: {
                                            value: /^[0-9]*$/,
                                            message: "El CUIT debe ser numérico"
                                        }
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            required
                                            id="cuit"
                                            label="CUIT"
                                            variant="outlined"
                                            error={Boolean(errors.cuit)}
                                            helperText={errors.cuit && errors.cuit.message}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <Controller
                                    name="ingresos_brutos"
                                    control={control}
                                    defaultValue=""
                                    rules={{
                                        required: "Este campo es requerido",
                                        pattern: {
                                            value: /^[0-9]*$/,
                                            message: "Ingresos Brutos debe ser numérico"
                                        }
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            required
                                            id="ingresos_brutos"
                                            label="Ingresos Brutos"
                                            variant="outlined"
                                            error={Boolean(errors.ingresos_brutos)}
                                            helperText={errors.ingresos_brutos && errors.ingresos_brutos.message}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <Controller
                                    name="nombre_fantasia"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            required
                                            id="nombre_fantasia"
                                            label="Nombre de Fantasía"
                                            variant="outlined"
                                            error={Boolean(errors.nombre_fantasia)}
                                            helperText={errors.nombre_fantasia && errors.nombre_fantasia.message}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth error={Boolean(errors.inicio_actividades)}>
                                <Controller
                                    name="inicio_actividades"
                                    control={control}
                                    defaultValue={dayjs()}
                                    render={({ field }) => (
                                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'es'}>
                                            <DatePicker
                                                {...field}
                                                label="Inicio de Actividades"
                                                value={field.value ? dayjs(field.value) : null}
                                                onChange={(value) => field.onChange(value)}
                                            />
                                        </LocalizationProvider>
                                    )}
                                />
                                <FormHelperText>{errors.inicio_actividades && errors.inicio_actividades.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Domicilio</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    name="direccion"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            required
                                            id="direccion"
                                            label="Dirección"
                                            variant="outlined"
                                            error={Boolean(errors.direccion)}
                                            helperText={errors.direccion && errors.direccion.message}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={4}>
                            <FormControl fullWidth>
                                <Controller
                                    name="localidad"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            required
                                            id="localidad"
                                            label="Localidad"
                                            variant="outlined"
                                            error={Boolean(errors.localidad)}
                                            helperText={errors.localidad && errors.localidad.message}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={4}>
                            <FormControl fullWidth>
                                <Controller
                                    name="codigo_postal"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            required
                                            id="codigo_postal"
                                            label="Código Postal"
                                            variant="outlined"
                                            error={Boolean(errors.codigo_postal)}
                                            helperText={errors.codigo_postal && errors.codigo_postal.message}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={4}>
                            <FormControl fullWidth required error={Boolean(errors.provincia_id)}>
                                <InputLabel id="provincia_label">Provincia</InputLabel>
                                <Controller
                                    name="provincia_id"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            id="provincia"
                                            labelId="provincia_label"
                                            label="Provincia"
                                        >
                                            {selectOptions.provincia.map((item) => (
                                                <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>))}
                                        </Select>
                                    )}
                                />
                                <FormHelperText>{errors.provincia_id && errors.provincia_id.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Contacto</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <Controller
                                    name="telefono"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            id="telefono"
                                            label="Teléfono"
                                            variant="outlined"
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <Controller
                                    name="email"
                                    control={control}
                                    defaultValue=""
                                    rules={{
                                        pattern: {
                                            value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                                            message: "Email inválido"
                                        }
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            id="email"
                                            label="Email"
                                            variant="outlined"
                                            error={Boolean(errors.email)}
                                            helperText={errors.email && errors.email.message}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                </SimpleTabPanel>
                <SimpleTabPanel value={tabValue} index={1}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <PuntoVentaDataGrid
                                rows={puntoVenta}
                                setRows={setPuntoVenta}
                            />
                        </Grid>
                    </Grid>
                </SimpleTabPanel>
                <SimpleTabPanel value={tabValue} index={2}>
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
                <Box sx={{ display: 'flex', justifyContent: 'right', mt: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        type="button"
                        onClick={handleSubmit(onSubmit, onError)}
                        disabled={isSubmitting}
                    >
                        Guardar
                    </Button>
                </Box>
            </Paper>
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