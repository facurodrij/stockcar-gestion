import React, {useEffect, useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {
    Alert,
    Box,
    Button, Checkbox,
    FormControl, FormControlLabel, FormGroup,
    FormHelperText, FormLabel,
    Grid, InputAdornment,
    InputLabel,
    MenuItem, OutlinedInput,
    Paper,
    Select,
    Snackbar, Tab, Tabs,
    TextField,
    Typography
} from "@mui/material";
import {DatePicker, LocalizationProvider} from '@mui/x-date-pickers';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Divider from "@mui/material/Divider";
import SimpleTabPanel from "../shared/SimpleTabPanel";
import {API} from "../../App";
import IconButton from "@mui/material/IconButton";
import AddIcon from '@mui/icons-material/Add';


export default function ArticuloForm(pk) {
    const {
        handleSubmit,
        control,
        formState: {errors},
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
        onClose: () => handleCloseSnackbar(false)
    });
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleCloseSnackbar = (redirect) => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = '/articulos';
        }
    }

    const fetchData = async () => {
        if (Boolean(pk.pk) === false) {
            const res = await fetch(`${API}/articulos/create`);
            return await res.json();
        } else {
            const res = await fetch(`${API}/articulos/${pk.pk}/update`);
            if (res.status === 404) {
                setSnackbar({
                    message: 'Artículo no encontrado',
                    severity: 'error',
                    onClose: () => handleCloseSnackbar(true)
                });
                setOpenSnackbar(true);
                return;
            }
            if (!res.ok) {
                setSnackbar({
                    message: 'Error al obtener los datos del artículo',
                    severity: 'error',
                    onClose: () => handleCloseSnackbar(false)
                });
                setOpenSnackbar(true);
                console.log(res);
                return;
            }
            return await res.json();
        }
    }

    useEffect(() => {
        fetchData().then((data) => {
            if (data) {
                const selectOptions = data['select_options'];
                setSelectOptions({
                    tipo_articulo: selectOptions.tipo_articulo,
                    tipo_unidad: selectOptions.tipo_unidad,
                    alicuota_iva: selectOptions.alicuota_iva,
                    tributo: selectOptions.tributo
                });
                if (Boolean(pk.pk)) {
                    const articulo = data['articulo'];
                    setValue('codigo_barras', articulo.codigo_barras);
                    if (articulo.codigo_fabricante) setValue('codigo_fabricante', articulo.codigo_fabricante);
                    if (articulo.codigo_proveedor) setValue('codigo_proveedor', articulo.codigo_proveedor);
                    if (articulo.codigo_interno) setValue('codigo_interno', articulo.codigo_interno);
                    setValue('descripcion', articulo.descripcion);
                    setValue('tipo_articulo_id', articulo.tipo_articulo.id);
                    setValue('tipo_unidad_id', articulo.tipo_unidad.id);
                    setValue('alicuota_iva_id', articulo.alicuota_iva.id);
                    setValue('observacion', articulo.observacion);
                }
            }
        });
    }, []);

    const onSubmit = (data) => {
        if (Boolean(pk.pk) === false) {
            fetch(`${API}/articulos/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(response => {
                if (response.ok) {
                    setSnackbar({
                        message: 'Artículo creado correctamente',
                        severity: 'success',
                        onClose: () => handleCloseSnackbar(true)
                    });
                    setOpenSnackbar(true);
                } else {
                    console.log(response);
                    setSnackbar({
                        message: 'Error al crear el artículo',
                        severity: 'error',
                        onClose: () => handleCloseSnackbar(false)
                    });
                    setOpenSnackbar(true);
                }
            });
        } else {
            fetch(`${API}/articulos/${pk.pk}/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(response => {
                if (response.ok) {
                    setSnackbar({
                        message: 'Artículo actualizado correctamente',
                        severity: 'success',
                        onClose: () => handleCloseSnackbar(true)
                    });
                    setOpenSnackbar(true);
                } else {
                    console.log(response);
                    setSnackbar({
                        message: 'Error al actualizar el artículo',
                        severity: 'error',
                        onClose: () => handleCloseSnackbar(false)
                    });
                    setOpenSnackbar(true);
                }
            });
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
                   sx={{mt: 2, padding: 2}}>
                <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                    <Tabs value={tabValue} onChange={handleTabChange} centered>
                        <Tab label="Principal"/>
                        <Tab label="Facturación"/>
                        <Tab label="Observaciones"/>
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
                                    rules={{required: "Este campo es requerido"}}
                                    render={({field}) => (
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
                                    render={({field}) => (
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
                                    render={({field}) => (
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
                                    render={({field}) => (
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
                                    rules={{required: "Este campo es requerido"}}
                                    render={({field}) => (
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
                                    rules={{required: "Este campo es requerido"}}
                                    render={({field}) => (
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
                                    rules={{required: "Este campo es requerido"}}
                                    render={({field}) => (
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
                                    rules={{required: "Este campo es requerido"}}
                                    render={({field}) => (
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
                </SimpleTabPanel>
                <SimpleTabPanel value={tabValue} index={2}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    name="observacion"
                                    control={control}
                                    defaultValue=""
                                    render={({field}) => (
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
                <Box sx={{display: 'flex', justifyContent: 'right', mt: 2}}>
                    <Button variant="contained" startIcon={<SaveIcon/>} type="submit">
                        Guardar
                    </Button>
                </Box>
            </Paper>
            <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={snackbar.onClose}>
                <Alert onClose={snackbar.onClose} severity={snackbar.severity} sx={{width: '100%'}}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
