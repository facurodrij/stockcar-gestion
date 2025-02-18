import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import {
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
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import SaveIcon from '@mui/icons-material/Save';
import { API } from '../../../../../App';
import fetchWithAuth from '../../../../../config/auth/fetchWithAuth';
import SnackbarAlert from '../../../../../common/components/SnackbarAlert';
import SimpleTabPanel from '../../../../../common/components/SimpleTabPanel';
import { useLoading } from '../../../../../common/contexts/LoadingContext';
import checkPermissions from '../../../../../config/auth/checkPermissions';
import PageTitle from '../../../../../common/components/PageTitle';


export default function ComercioForm({ permissions }) {
    const pk = useParams().pk;
    const {
        handleSubmit,
        control,
        formState: { errors },
        setValue
    } = useForm();
    const [selectOptions, setSelectOptions] = useState({
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { withLoading } = useLoading();

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
        checkPermissions(permissions);
    }, [permissions]);

    useEffect(() => {
        const fetchData = async () => {
            const url = Boolean(pk) ? `${API}/comercios/${pk}/update` : `${API}/comercios/create`;
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
                    tipo_responsable: data.tipo_responsable,
                    provincia: data.provincia
                });
                if (Boolean(pk)) {
                    const comercio = data['comercio'];
                    setValue('tipo_responsable_id', comercio.tipo_responsable_id);
                    setValue('razon_social', comercio.razon_social);
                    setValue('cuit', comercio.cuit);
                    setValue('ingresos_brutos', comercio.ingresos_brutos);
                    setValue('nombre_fantasia', comercio.nombre_fantasia);
                    setValue('inicio_actividades', dayjs(comercio.inicio_actividades));
                    setValue('direccion', comercio.direccion);
                    setValue('localidad', comercio.localidad);
                    setValue('codigo_postal', comercio.codigo_postal);
                    setValue('provincia_id', comercio.provincia_id);
                    if (comercio.telefono) setValue('telefono', comercio.telefono);
                    if (comercio.email) setValue('email', comercio.email);
                    if (comercio.observacion) setValue('observacion', comercio.observacion);
                }
            }
            catch (e) {
                console.error('Error en la carga de datos:', e);
                setSnackbar({
                    message: e.message,
                    severity: 'error',
                    onClose: () => handleCloseSnackbar(false)
                });
                setOpenSnackbar(true);
            }
        }
        withLoading(loadData);
    }, [pk, setValue, withLoading]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        const url = Boolean(pk) ? `${API}/comercios/${pk}/update` : `${API}/comercios/create`;
        const method = Boolean(pk) ? 'PUT' : 'POST';
        try {
            const res = await fetchWithAuth(url, method, data);
            const resJson = await res.json();
            if (!res.ok) {
                throw new Error(resJson['error']);
            }
            setSnackbar({
                message: 'Comercio guardado correctamente',
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
            <PageTitle heading={Boolean(pk) ? 'Editar Comercio' : 'Agregar Comercio'} />
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
                                                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>))}
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
                                                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>))}
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