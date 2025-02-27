import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import {
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
    Tab,
    Tabs,
    TextField,
    Typography
} from "@mui/material";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Search, Save } from '@mui/icons-material';
import dayjs from 'dayjs';
import SimpleTabPanel from '../../../../../common/components/SimpleTabPanel';
import { API } from '../../../../../App';
import TributoDataGrid from '../../../../../common/components/TributoDataGrid';
import fetchWithAuth from '../../../../../config/auth/fetchWithAuth';
import SnackbarAlert from '../../../../../common/components/SnackbarAlert';
import { useLoading } from '../../../../../common/contexts/LoadingContext';
import checkPermissions from '../../../../../config/auth/checkPermissions';
import PageTitle from '../../../../../common/components/PageTitle';


export default function ClienteForm({ permissions }) {
    const pk = useParams().pk;
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
        genero: [],
        tipo_pago: [],
        moneda: []
    });
    const [tabValue, setTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [tributos, setTributos] = useState([]);
    const [selectedTributo, setSelectedTributo] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [allowSearch, setAllowSearch] = useState(false);
    const { withLoading } = useLoading();

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleCloseSnackbar = (redirect) => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = '/clientes';
        }
    };

    useEffect(() => {
        checkPermissions(permissions);
    }, [permissions]);

    useEffect(() => {
        const fetchData = async () => {
            const url = Boolean(pk) ? `${API}/clientes/${pk}/update` : `${API}/clientes/create`;
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
                    tipo_documento: data.tipo_documento,
                    tipo_responsable: data.tipo_responsable,
                    provincia: data.provincia,
                    genero: data.genero,
                    tipo_pago: data.tipo_pago,
                    moneda: data.moneda
                });
                setTributos(data.tributos);
                if (Boolean(pk)) {
                    const cliente = data['cliente'];
                    const tributos = cliente['tributos'];
                    setValue('tipo_responsable_id', cliente.tipo_responsable_id);
                    setValue('razon_social', cliente.razon_social);
                    setValue('tipo_documento_id', cliente.tipo_documento_id);
                    setValue('nro_documento', cliente.nro_documento);
                    setValue('direccion', cliente.direccion);
                    setValue('localidad', cliente.localidad);
                    setValue('codigo_postal', cliente.codigo_postal);
                    setValue('provincia_id', cliente.provincia_id);
                    if (cliente.fecha_nacimiento) setValue('fecha_nacimiento', dayjs(cliente.fecha_nacimiento));
                    if (cliente.genero_id) setValue('genero_id', cliente.genero_id);
                    if (cliente.telefono) setValue('telefono', cliente.telefono);
                    if (cliente.email) setValue('email', cliente.email);
                    setValue('descuento', cliente.descuento);
                    setValue('recargo', cliente.recargo);
                    setValue('tipo_pago_id', cliente.tipo_pago_id);
                    setValue('moneda_id', cliente.moneda_id);
                    setValue('limite_credito', cliente.limite_credito);
                    setValue('exento_iva', cliente.exento_iva);
                    setValue('duplicado_factura', cliente.duplicado_factura);
                    if (cliente.observacion) setValue('observacion', cliente.observacion);
                    setSelectedTributo([])
                    tributos.forEach(t => {
                        setSelectedTributo(selectedTributo => [...selectedTributo, t]);
                    });
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
            const url = `${API}/clientes/afip?nro_documento=${nro_documento}`;
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
        const url = Boolean(pk) ? `${API}/clientes/${pk}/update` : `${API}/clientes/create`;
        const method = Boolean(pk) ? 'PUT' : 'POST';
        try {
            data['tributos'] = selectedTributo;
            const res = await fetchWithAuth(url, method, data);
            const resJson = await res.json();
            if (!res.ok) {
                throw new Error(resJson['error']);
            }
            setSnackbar({
                message: 'Cliente guardado correctamente',
                severity: 'success',
                autoHideDuration: 4000,
                onClose: () => handleCloseSnackbar(true)
            });
        } catch (e) {
            console.error('Error al guardar el cliente:', e);
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
            errors['direccion'] || errors['localidad'] || errors['codigo_postal'] || errors['provincia_id'] || errors['fecha_nacimiento'] ||
            errors['genero_id'] || errors['email']) {
            setTabValue(0);
            return;
        }
        if (errors['descuento'] || errors['recargo'] || errors['tipo_pago_id'] || errors['moneda_id'] || errors['limite_credito']) {
            setTabValue(1);
        }
    }

    return (
        <>
            <PageTitle heading={Boolean(pk) ? 'Editar Cliente' : 'Nuevo Cliente'} />
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
                        <Tab label="Facturación" />
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
                                                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>))}
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
                            <FormControl fullWidth error={Boolean(errors.fecha_nacimiento)}>
                                <Controller
                                    name="fecha_nacimiento"
                                    control={control}
                                    defaultValue={null}
                                    rules={{
                                        validate: value => {
                                            if (!value) return true;
                                            const selectedDate = dayjs(value);
                                            const currentDate = dayjs();
                                            return selectedDate < currentDate || "La fecha de nacimiento no puede ser futura";
                                        }
                                    }}
                                    render={({ field }) => (
                                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'es'}>
                                            <DatePicker
                                                {...field}
                                                label="Fecha de Nacimiento"
                                                maxDate={dayjs()}
                                                inputFormat="DD/MM/YYYY"
                                            />
                                        </LocalizationProvider>
                                    )}
                                />
                                <FormHelperText>{errors.fecha_nacimiento && errors.fecha_nacimiento.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel id="genero_label">Género</InputLabel>
                                <Controller
                                    name="genero_id"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            id="genero"
                                            labelId="genero_label"
                                            label="Género"
                                        >
                                            {selectOptions.genero.map((item) => (
                                                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>))}
                                        </Select>
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
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <Controller
                                    name="descuento"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            id="descuento"
                                            label="Descuento"
                                            variant="outlined"
                                            type="number"
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">%</InputAdornment>
                                            }}
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
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            id="recargo"
                                            label="Recargo"
                                            variant="outlined"
                                            type="number"
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">%</InputAdornment>
                                            }}
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
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel id="moneda_label">Moneda</InputLabel>
                                <Controller
                                    name="moneda_id"
                                    control={control}
                                    defaultValue=""
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
                                    name="limite_credito"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            id="limite_credito"
                                            label="Límite de Crédito"
                                            variant="outlined"
                                            type="number"
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl component="fieldset" variant="standard">
                                <FormLabel component="legend">Marque si aplica</FormLabel>
                                <FormGroup>
                                    <Controller
                                        name="exento_iva"
                                        control={control}
                                        defaultValue={false}
                                        render={({ field: { onChange, value } }) => (
                                            <FormControlLabel
                                                control={<Checkbox checked={value} onChange={onChange} />}
                                                label="Exento de IVA"
                                                disabled // TODO: Implementar exento de IVA
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="duplicado_factura"
                                        control={control}
                                        defaultValue={false}
                                        render={({ field: { onChange, value } }) => (
                                            <FormControlLabel
                                                control={<Checkbox checked={value} onChange={onChange} />}
                                                label="Factura duplicado"
                                                disabled // TODO: Implementar factura duplicado
                                            />
                                        )}
                                    />
                                </FormGroup>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Tributos adicionales</Typography>
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
                            startIcon={<Save />}
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