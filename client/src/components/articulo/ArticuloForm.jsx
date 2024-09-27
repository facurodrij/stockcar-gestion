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
import TributoDataGrid from "../tributo/TributoDataGrid";
import fetchWithAuth from '../../utils/fetchWithAuth';
import SnackbarAlert from '../shared/SnackbarAlert';
import { useLoading } from '../../utils/loadingContext';
import { useConfirm } from 'material-ui-confirm';


export default function ArticuloForm({ pk }) {
    const {
        handleSubmit,
        control,
        formState: { errors },
        setValue
    } = useForm();
    const [selectOptions, setSelectOptions] = useState({
        tipo_articulo: [],
        tipo_unidad: [],
        alicuota_iva: [],
        tributo: []
    });
    const [tabValue, setTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [selectedTributo, setSelectedTributo] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { withLoading } = useLoading();
    const confirm = useConfirm();

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleCloseSnackbar = (redirect) => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = '/articulos';
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            const url = Boolean(pk) ? `${API}/articulos/${pk}/update` : `${API}/articulos/create`;
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
                    tipo_articulo: selectOptions.tipo_articulo,
                    tipo_unidad: selectOptions.tipo_unidad,
                    alicuota_iva: selectOptions.alicuota_iva,
                    tributo: selectOptions.tributo
                });
                if (Boolean(pk)) {
                    const articulo = data['articulo'];
                    const tributos = articulo['tributos'];
                    setValue('codigo_principal', articulo.codigo_principal);
                    if (articulo.codigo_secundario) setValue('codigo_secundario', articulo.codigo_secundario);
                    if (articulo.codigo_terciario) setValue('codigo_terciario', articulo.codigo_terciario);
                    if (articulo.codigo_cuaternario) setValue('codigo_cuaternario', articulo.codigo_cuaternario);
                    if (articulo.codigo_adicional) setValue('codigo_adicional', articulo.codigo_adicional.join(', '));
                    // Es necesario setear el valor de la descripción y la línea de factura
                    setDescripcion(articulo.descripcion);
                    setLineaFactura(articulo.linea_factura);
                    setValue('descripcion', articulo.descripcion);
                    setValue('linea_factura', articulo.linea_factura);
                    setValue('tipo_articulo_id', articulo.tipo_articulo.id);
                    setValue('tipo_unidad_id', articulo.tipo_unidad.id);
                    setValue('alicuota_iva_id', articulo.alicuota_iva.id);
                    setValue('stock_actual', articulo.stock_actual);
                    if (articulo.stock_minimo) setValue('stock_minimo', articulo.stock_minimo);
                    if (articulo.stock_maximo) setValue('stock_maximo', articulo.stock_maximo);
                    if (articulo.observacion) setValue('observacion', articulo.observacion);

                    // Cargar los tributos seleccionados
                    setSelectedTributo([])
                    tributos.forEach((t) => {
                        setSelectedTributo(selectedTributo => [...selectedTributo, t.id]);
                    });
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
    }, [pk, withLoading, setValue]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        const url = Boolean(pk) ? `${API}/articulos/${pk}/update` : `${API}/articulos/create`;
        const method = Boolean(pk) ? 'PUT' : 'POST';
        try {
            if (data['codigo_adicional']) {
                data['codigo_adicional'] = data['codigo_adicional'].split(',').map((c) => c.trim());
            }
            let res = await fetchWithAuth(url, method, {
                articulo: data, tributos: selectedTributo
            });
            let resJson = await res.json();
            if (res.status === 409 && resJson['warning']) {
                const existingArticlesLinks = resJson.ids.map(id => `<a href="/articulos/form/${id}" target="_blank">Artículo ${id}</a>`).join(', ');
                const description = `${resJson.warning}. Son los siguientes: ${existingArticlesLinks}.`;
                confirm({
                    title: 'Advertencia',
                    description: <span dangerouslySetInnerHTML={{ __html: description }} />,
                    confirmationText: 'Guardar de todas formas',
                    cancellationText: 'Cancelar'
                })
                    .then(async () => {
                        res = await fetchWithAuth(url, method, {
                            articulo: data, tributos: selectedTributo, force: true
                        });
                        resJson = await res.json();
                        if (!res.ok) {
                            throw new Error(resJson['error']);
                        }
                        setSnackbar({
                            message: 'Artículo guardado correctamente',
                            severity: 'success',
                            autoHideDuration: 4000,
                            onClose: () => handleCloseSnackbar(true)
                        });
                        setOpenSnackbar(true);
                    })
                    .catch(() => {
                        setIsSubmitting(false);
                        return;
                    });
            } else if (!res.ok) {
                throw new Error(resJson['error']);
            } else {
                setSnackbar({
                    message: 'Artículo guardado correctamente',
                    severity: 'success',
                    autoHideDuration: 4000,
                    onClose: () => handleCloseSnackbar(true)
                });
                setOpenSnackbar(true);
            }
        } catch (e) {
            console.error('Error al guardar el artículo:', e);
            setSnackbar({
                message: e.message,
                severity: 'error',
                autoHideDuration: null,
                onClose: () => handleCloseSnackbar(false)
            });
            setIsSubmitting(false);
            setOpenSnackbar(true);
        }
    }

    const onError = (errors) => {
        if (errors['codigo_principal'] || errors['descripcion'] || errors['linea_factura'] || errors['stock_actual']) {
            setTabValue(0);
            return;
        }
        if (errors['tipo_articulo_id'] || errors['tipo_unidad_id'] || errors['alicuota_iva_id']) {
            setTabValue(2);
        }
    }

    const [descripcion, setDescripcion] = useState('');
    const [lineaFactura, setLineaFactura] = useState('');

    useEffect(() => {
        setLineaFactura(descripcion.substring(0, 30));
        setValue('linea_factura', descripcion.substring(0, 30));
    }, [descripcion, setValue]);

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
                        aria-label="scrollable force tabs example"
                    >
                        <Tab label="Principal" />
                        <Tab label="Códigos" />
                        <Tab label="Facturación" />
                        <Tab label="Observaciones" />
                    </Tabs>
                </Box>
                <SimpleTabPanel value={tabValue} index={0}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    name="codigo_principal"
                                    control={control}
                                    defaultValue=""
                                    rules={{
                                        required: "Este campo es requerido",
                                        maxLength: {
                                            value: 20,
                                            message: "Máximo 20 caracteres."
                                        }
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            required
                                            id="codigo_principal"
                                            label="Código principal"
                                            variant="outlined"
                                            error={Boolean(errors.codigo_principal)}
                                            helperText={
                                                errors.codigo_principal
                                                    ? errors.codigo_principal.message
                                                    : "Máximo 20 caracteres. Será utilizado en los renglones de venta."
                                            }
                                            inputProps={{ maxLength: 20 }}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    name="descripcion"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            required
                                            id="descripcion"
                                            label="Descripción"
                                            variant="outlined"
                                            multiline
                                            rows={4}
                                            value={descripcion}
                                            onChange={(e) => {
                                                setDescripcion(e.target.value);
                                                field.onChange(e);
                                            }}
                                            error={Boolean(errors.descripcion)}
                                            helperText={errors.descripcion && errors.descripcion.message}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    name="linea_factura"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            required
                                            id="linea_factura"
                                            label="Línea de factura"
                                            variant="outlined"
                                            value={lineaFactura}
                                            onChange={(e) => {
                                                const value = e.target.value.substring(0, 30);
                                                setLineaFactura(value);
                                                field.onChange(value);
                                            }}
                                            error={Boolean(errors.linea_factura)}
                                            helperText={
                                                errors.linea_factura
                                                    ? errors.linea_factura.message
                                                    : "Máximo 30 caracteres. Será utilizado como descripción por defecto en los renglones de venta."
                                            }
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Inventario</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <Controller
                                    name="stock_actual"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            required
                                            id="stock_actual"
                                            label="Stock actual"
                                            variant="outlined"
                                            type="number"
                                            error={Boolean(errors.stock_actual)}
                                            helperText={errors.stock_actual && errors.stock_actual.message}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <Controller
                                    name="stock_minimo"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            id="stock_minimo"
                                            label="Stock mínimo"
                                            variant="outlined"
                                            type="number"
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <Controller
                                    name="stock_maximo"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            id="stock_maximo"
                                            label="Stock máximo"
                                            variant="outlined"
                                            type="number"
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
                                    name="codigo_secundario"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            id="codigo_secundario"
                                            label="Código secundario"
                                            variant="outlined"
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    name="codigo_terciario"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            id="codigo_terciario"
                                            label="Código terciario"
                                            variant="outlined"
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    name="codigo_cuaternario"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            id="codigo_cuaternario"
                                            label="Código cuaternario"
                                            variant="outlined"
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    name="codigo_adicional"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            id="codigo_adicional"
                                            label="Códigos adicionales"
                                            variant="outlined"
                                            helperText={"(Opcional) Ingrese los códigos adicionales separados por comas. Ej: ABC123, XYZ789"}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                </SimpleTabPanel>
                <SimpleTabPanel value={tabValue} index={2}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required error={Boolean(errors.tipo_articulo)}>
                                <InputLabel id="tipo_articulo_label">Tipo de artículo</InputLabel>
                                <Controller
                                    name="tipo_articulo_id"
                                    control={control}
                                    defaultValue="1"
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            id="tipo_articulo"
                                            labelId="tipo_articulo_label"
                                            label="Tipo de artículo"
                                        >
                                            {selectOptions.tipo_articulo.map((option) => (
                                                <MenuItem key={option.id} value={option.id}>{option.nombre}</MenuItem>
                                            ))}
                                        </Select>
                                    )}
                                />
                                <FormHelperText>{errors.tipo_articulo && errors.tipo_articulo.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required error={Boolean(errors.tipo_unidad)}>
                                <InputLabel id="tipo_unidad_label">Tipo de unidad</InputLabel>
                                <Controller
                                    name="tipo_unidad_id"
                                    control={control}
                                    defaultValue="1"
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            id="tipo_unidad"
                                            labelId="tipo_unidad_label"
                                            label="Tipo de unidad"
                                        >
                                            {selectOptions.tipo_unidad.map((option) => (
                                                <MenuItem key={option.id} value={option.id}>{option.nombre}</MenuItem>
                                            ))}
                                        </Select>
                                    )}
                                />
                                <FormHelperText>{errors.tipo_unidad && errors.tipo_unidad.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required error={Boolean(errors.alicuota_iva)}>
                                <InputLabel id="alicuota_iva_label">Alícuota de IVA</InputLabel>
                                <Controller
                                    name="alicuota_iva_id"
                                    control={control}
                                    defaultValue="1"
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            id="alicuota_iva"
                                            label="Alícuota de IVA"
                                            labelId="alicuota_iva_label"
                                        >
                                            {selectOptions.alicuota_iva.map((option) => (
                                                <MenuItem key={option.id}
                                                    value={option.id}>{option.descripcion}</MenuItem>
                                            ))}
                                        </Select>
                                    )}
                                />
                                <FormHelperText>{errors.alicuota_iva && errors.alicuota_iva.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Tributos adicionales</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TributoDataGrid
                                tributos={selectOptions.tributo}
                                selectedTributo={selectedTributo}
                                setSelectedTributo={setSelectedTributo}
                            />
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
