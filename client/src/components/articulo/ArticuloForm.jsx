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
                    setValue('codigo_barras', articulo.codigo_barras);
                    if (articulo.codigo_fabricante) setValue('codigo_fabricante', articulo.codigo_fabricante);
                    if (articulo.codigo_proveedor) setValue('codigo_proveedor', articulo.codigo_proveedor);
                    if (articulo.codigo_interno) setValue('codigo_interno', articulo.codigo_interno);
                    setValue('descripcion', articulo.descripcion);
                    setValue('tipo_articulo_id', articulo.tipo_articulo.id);
                    setValue('tipo_unidad_id', articulo.tipo_unidad.id);
                    setValue('alicuota_iva_id', articulo.alicuota_iva.id);
                    setValue('observacion', articulo.observacion);
                    setSelectedTributo([])
                    tributos.map((t) => {
                        setSelectedTributo(selectedTributo => [...selectedTributo, t.id]);
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
        loadData();
    }, []);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        const url = Boolean(pk) ? `${API}/articulos/${pk}/update` : `${API}/articulos/create`;
        const method = Boolean(pk) ? 'PUT' : 'POST';
        try {
            const res = await fetchWithAuth(url, method, {
                articulo: data, tributos: selectedTributo
            });
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
            console.error('Error al guardar el artículo:', e);
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
        if (errors['codigo_barras'] || errors['descripcion']) {
            setTabValue(0);
            return;
        }
        if (errors['tipo_articulo_id'] || errors['tipo_unidad_id'] || errors['alicuota_iva_id']) {
            setTabValue(1);
        }
    }

    return (
        <>
            <Paper elevation={3} component="form" onSubmit={handleSubmit(onSubmit, onError)} noValidate
                sx={{ mt: 2, padding: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} centered>
                        <Tab label="Principal" />
                        <Tab label="Facturación" />
                        <Tab label="Observaciones" />
                    </Tabs>
                </Box>
                <SimpleTabPanel value={tabValue} index={0}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    name="codigo_barras"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            required
                                            id="codigo_barras"
                                            label="Código de barras"
                                            variant="outlined"
                                            error={Boolean(errors.codigo_barras)}
                                            helperText={errors.codigo_barras && errors.codigo_barras.message}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    name="codigo_fabricante"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            id="codigo_fabricante"
                                            label="Código de fabricante"
                                            variant="outlined"
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    name="codigo_proveedor"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            id="codigo_proveedor"
                                            label="Código de proveedor"
                                            variant="outlined"
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    name="codigo_interno"
                                    control={control}
                                    defaultValue=""
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            id="codigo_interno"
                                            label="Código interno"
                                            variant="outlined"
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
                                            error={Boolean(errors.descripcion)}
                                            helperText={errors.descripcion && errors.descripcion.message}
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
                        <Grid item xs={6}>
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
                        <Grid item xs={6}>
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
