import React, {useEffect, useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {
    Alert,
    Box,
    Button,
    FormControl,
    FormHelperText,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    TextField,
    Typography,
    Tabs,
    Tab
} from "@mui/material";
import {DatePicker, LocalizationProvider} from '@mui/x-date-pickers';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import {API} from "../../App";
import Divider from "@mui/material/Divider";
import SimpleTabPanel from "../shared/SimpleTabPanel";

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

export default function VentaForm(pk) {
    const {
        handleSubmit,
        control,
        formState: {errors},
        setValue,
        trigger
    } = useForm();
    const [selectOptions, setSelectOptions] = useState({
        tipo_responsable: [],
        provincia: []
    });
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        onClose: () => handleCloseSnackbar(false)
    });
    // Constantes para el manejo de Tabs
    const [tabValue, setTabValue] = useState(0);
    const handleChangeTab = (event, newValue) => {
        setTabValue(newValue);
    }


    const fetchData = async () => {
        if (Boolean(pk.pk) === false) {
            const res = await fetch(`${API}/ventas/create`);
            return await res.json();
        } else {
            const res = await fetch(`${API}/ventas/${pk.pk}/update`);
            if (res.status === 404) {
                setSnackbar({
                    message: 'Venta no encontrada',
                    severity: 'error',
                    onClose: () => handleCloseSnackbar(true)
                });
                setOpenSnackbar(true);
                return;
            }
            if (!res.ok) {
                setSnackbar({
                    message: 'Error al obtener los datos de la venta',
                    severity: 'error',
                    onClose: () => handleCloseSnackbar(true)
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
                    tipo_responsable: selectOptions.tipo_responsable,
                    provincia: selectOptions.provincia
                });
                if (Boolean(pk.pk)) {
                    const venta = data['venta'];
                    setValue('tipo_responsable', venta.tipo_responsable.id);
                    setValue('razon_social', venta.razon_social);
                }
            }
        });
    }, []);


    const onSubmit = async (data) => {
        // const result = await trigger(['tipo_responsable', 'razon_social', 'direccion', 'localidad', 'codigo_postal', 'provincia']);
        // console.log(result);
        // if (!result) {
        //     if (errors.tipo_responsable || errors.razon_social) {
        //         // setTabValue(0);
        //         alert('Error en la pestaña 1');
        //     } else if (errors.direccion || errors.localidad || errors.codigo_postal || errors.provincia) {
        //         // setTabValue(1);
        //         alert('Error en la pestaña 2');
        //     }
        //     return;
        // }
        if (Boolean(pk.pk) === false) {
            fetch(`${API}/ventas/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(response => {
                if (response.ok) {
                    setSnackbar({
                        message: 'Venta creada correctamente',
                        severity: 'success',
                        onClose: () => handleCloseSnackbar(false)
                    });
                    setOpenSnackbar(true);
                } else {
                    console.log(response);
                    setSnackbar({
                        message: 'Error al crear la venta',
                        severity: 'error',
                        onClose: () => handleCloseSnackbar(false)
                    });
                    setOpenSnackbar(true);
                }
            });
        } else {
            fetch(`${API}/ventas/${pk.pk}/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(response => {
                if (response.ok) {
                    setSnackbar({
                        message: 'Venta actualizada correctamente',
                        severity: 'success',
                        onClose: () => handleCloseSnackbar(true)
                    });
                    setOpenSnackbar(true);
                } else {
                    console.log(response);
                    setSnackbar({
                        message: 'Error al actualizar la venta',
                        severity: 'error',
                        onClose: () => handleCloseSnackbar(false)
                    });
                    setOpenSnackbar(true);
                }
            });
        }
    }

    const onError = (errors) => {
        if (errors.tipo_responsable || errors.razon_social) {
            setTabValue(0);
            return;
        }
        if (errors.direccion || errors.localidad || errors.codigo_postal || errors.provincia) {
            setTabValue(1);
        }
    }

    const handleCloseSnackbar = (redirect) => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = '/ventas';
        }
    }

    return (
        <>
            <Paper elevation={3} component="form" onSubmit={handleSubmit(onSubmit, onError)} noValidate
                   sx={{mt: 2, padding: 2}}>
                <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                    <Tabs value={tabValue} onChange={handleChangeTab} centered>
                        <Tab label="Identidad"/>
                        <Tab label="Dirección"/>
                    </Tabs>
                </Box>
                <SimpleTabPanel value={tabValue} index={0}>
                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <FormControl fullWidth required error={Boolean(errors.tipo_responsable)}>
                                <InputLabel id="tipo_responsable_label">Tipo de Responsable IVA</InputLabel>
                                <Controller
                                    name="tipo_responsable"
                                    control={control}
                                    defaultValue=""
                                    rules={{required: "Este campo es requerido"}}
                                    render={({field}) => (
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
                                <FormHelperText>{errors.tipo_responsable && errors.tipo_responsable.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                        <Grid item xs={8}>
                            <FormControl fullWidth>
                                <Controller
                                    name="razon_social"
                                    control={control}
                                    defaultValue=""
                                    rules={{required: "Este campo es requerido"}}
                                    render={({field}) => (
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
                </SimpleTabPanel>
                <SimpleTabPanel value={tabValue} index={1}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    name="direccion"
                                    control={control}
                                    defaultValue=""
                                    rules={{required: "Este campo es requerido"}}
                                    render={({field}) => (
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
                                    rules={{required: "Este campo es requerido"}}
                                    render={({field}) => (
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
                                    rules={{required: "Este campo es requerido"}}
                                    render={({field}) => (
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
                            <FormControl fullWidth required error={Boolean(errors.provincia)}>
                                <InputLabel id="provincia_label">Provincia</InputLabel>
                                <Controller
                                    name="provincia"
                                    control={control}
                                    defaultValue=""
                                    rules={{required: "Este campo es requerido"}}
                                    render={({field}) => (
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
                                <FormHelperText>{errors.provincia && errors.provincia.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                    </Grid>
                </SimpleTabPanel>
                <Box sx={{display: 'flex', justifyContent: 'space-between', mt: 2}}>
                    <Button variant="outlined" startIcon={<ArrowBackIcon/>} onClick={() => window.history.back()}>
                        Cancelar
                    </Button>
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