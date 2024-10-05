import React, { useEffect, useState } from 'react';
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
import SaveIcon from '@mui/icons-material/Save';
import SimpleTabPanel from "../shared/SimpleTabPanel";
import { API } from "../../App";
import fetchWithAuth from '../../utils/fetchWithAuth';
import SnackbarAlert from '../shared/SnackbarAlert';
import { Search } from '@mui/icons-material';
import { useLoading } from '../../utils/loadingContext';


export default function ProveedorForm({ pk }) {
    const {
        handleSubmit,
        control,
        formState: { errors },
        setValue,
        getValues
    } = useForm();
    const [selectOptions, setSelectOptions] = useState({
        tipo_documento: [],
        tipo_responsable: [],
        provincia: [],
        tipo_pago: [],
        moneda: [],
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
    const [allowSearch, setAllowSearch] = useState(false);
    const { withLoading } = useLoading();

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    }

    const handleCloseSnackbar = (redirect) => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = '/proveedores';
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            const url = Boolean(pk) ? `${API}/proveedores/${pk}/update` : `${API}/proveedores/create`;
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
                const selectOptions = data['select_options'];
                setSelectOptions({
                    tipo_documento: selectOptions.tipo_documento,
                    tipo_responsable: selectOptions.tipo_responsable,
                    provincia: selectOptions.provincia
                });
                if (Boolean(pk)) {
                    const proveedor = data['proveedor'];
                    setValue('tipo_responsable_id', proveedor.tipo_responsable.id);
                    setValue('razon_social', proveedor.razon_social);
                    setValue('tipo_documento_id', proveedor.tipo_documento.id);
                    setValue('nro_documento', proveedor.nro_documento);
                    setValue('direccion', proveedor.direccion);
                    setValue('localidad', proveedor.localidad);
                    setValue('codigo_postal', proveedor.codigo_postal);
                    setValue('provincia_id', proveedor.provincia.id);
                    if (proveedor.telefono) setValue('telefono', proveedor.telefono);
                    if (proveedor.email) setValue('email', proveedor.email);
                    if (proveedor.observacion) setValue('observacion', proveedor.observacion);
                }
            }
            catch (e) {
                console.error('Error en la carga de datos:', e);
                setSnackbar({
                    message: e.message,
                    severity: 'error',
                    onClose: () => handleCloseSnackbar(true)
                });
                setOpenSnackbar(true);
            }
        }
        withLoading(loadData);
    }, [pk, setValue, withLoading]);

    const searchAfip = async () => {
        const fetchData = async () => {
            const nro_documento = getValues('nro_documento');
            if (!nro_documento) {
                throw new Error('Debe ingresar un número de documento');
            }
            if (!/^[0-9]*$/.test(nro_documento)) {
                throw new Error('El número de documento debe ser numérico');
            }
            const url = `${API}/proveedores/afip?nro_documento=${nro_documento}`;
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data['error']);
            }
            return data;
        }
        const loadData = async () => {
            try {
                const data = await fetchData();
                setValue('tipo_responsable_id', data['tipo_responsable_id']);
                setValue('razon_social', data['razon_social']);
                setValue('direccion', data['direccion']);
                setValue('localidad', data['localidad']);
                setValue('codigo_postal', data['codigo_postal']);
                setValue('provincia_id', data['provincia_id']);
                setValue('telefono', data['telefono']);
                setValue('email', data['email']);
            } catch (e) {
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
    }

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        const url = Boolean(pk) ? `${API}/proveedores/${pk}/update` : `${API}/proveedores/create`;
        const method = Boolean(pk) ? 'PUT' : 'POST';
        try {
            const res = await fetchWithAuth(url, method, {
                proveedor: data
            });
            const resJson = await res.json();
            if (!res.ok) {
                throw new Error(resJson['error']);
            }
            setSnackbar({
                message: 'Proveedor guardado correctamente',
                severity: 'success',
                autoHideDuration: 4000,
                onClose: () => handleCloseSnackbar(true)
            });
        } catch (e) {
            console.error('Error al guardar el proveedor:', e);
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
        if (errors['tipo_responsable_id'] || errors['razon_social'] || errors['tipo_documento_id'] || errors['nro_documento'] ||
            errors['direccion'] || errors['localidad'] || errors['codigo_postal'] || errors['provincia_id'] || errors['fecha_nacimiento'] || errors['email']) {
            setTabValue(0);
            return;
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
                        <Tab label="Observaciones" />
                    </Tabs>
                </Box>
                <SimpleTabPanel value={tabValue} index={0}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth required error={Boolean(errors.tipo_documento_id)}>
                                <InputLabel id="tipo_documento_label">Tipo de Documento</InputLabel>
                                <Controller
                                    name="tipo_documento_id"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            id="tipo_documento"
                                            labelId="tipo_documento_label"
                                            label="Tipo de Documento"
                                            onChange={(e) => {
                                                field.onChange(e);
                                                // Si el tipo de documento es CUIT, se permite la búsqueda en AFIP
                                                setAllowSearch(e.target.value === 1);
                                            }
                                            }
                                        >
                                            {selectOptions.tipo_documento.map((item) => (
                                                <MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
                                        </Select>
                                    )}
                                />
                                <FormHelperText>{errors.tipo_documento_id && errors.tipo_documento_id.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <FormControl fullWidth>
                                <Controller
                                    name="nro_documento"
                                    control={control}
                                    defaultValue=""
                                    rules={{
                                        required: "Este campo es requerido",
                                        pattern: {
                                            value: /^[0-9]*$/,
                                            message: "El número de documento debe ser numérico"
                                        }
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            required
                                            id="nro_documento"
                                            label="Número de Documento"
                                            variant="outlined"
                                            error={Boolean(errors.nro_documento)}
                                            helperText={errors.nro_documento && errors.nro_documento.message}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button
                                startIcon={<Search />}
                                variant="contained"
                                color="primary"
                                fullWidth
                                disabled={!allowSearch}
                                onClick={searchAfip}
                            >
                                Buscar en AFIP
                            </Button>
                        </Grid>
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