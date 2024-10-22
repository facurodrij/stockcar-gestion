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
    Typography,
} from "@mui/material";
import {
    Add as AddIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import SimpleTabPanel from "../shared/SimpleTabPanel";
import { API } from "../../App";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import fetchWithAuth from '../../utils/fetchWithAuth';
import SnackbarAlert from '../shared/SnackbarAlert';
import ArticuloSelectorDialog from "../shared/ArticuloSelectorDialog";
import { esES } from "@mui/x-data-grid/locales";
import { useLoading } from '../../utils/loadingContext';


const CustomToolbar = ({ onOpen }) => {
    return (
        <GridToolbarContainer sx={{ borderBottom: 1, borderColor: 'divider', pb: .5 }}>
            <Button
                color='primary'
                startIcon={<AddIcon />}
                onClick={() => onOpen(true)}
            >
                Seleccionar Artículos
            </Button>
        </GridToolbarContainer>
    );
}

export default function MovStockForm() {
    const {
        handleSubmit,
        control,
        formState: { errors },
        setValue
    } = useForm();
    const [selectOptions, setSelectOptions] = useState({
        tipo_movimiento: [],
        origen: []
    });
    const [tabValue, setTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const [movimientoRenlones, setMovimientoRenglones] = useState([]);
    const [selectedArticulo, setSelectedArticulo] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [openArticuloDialog, setOpenArticuloDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { withLoading } = useLoading();

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    }

    const handleCloseSnackbar = (redirect) => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = '/movimientos-stock';
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            const url = `${API}/movimientos-stock/create`;
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                const message = `Error al obtener datos: ${data['error']}`;
                throw new Error(message);
            }
            return data;
        }
        const loadData = async () => {
            try {
                const data = await fetchData();
                const selectOptions = data['select_options'];
                setSelectOptions({
                    tipo_movimiento: selectOptions['tipo_movimiento'],
                    origen: selectOptions['origen']
                });
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
    }, [setValue, withLoading]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        const url = `${API}/movimientos-stock/create`;
        const method = 'POST';
        try {
            if (selectedArticulo.length === 0) {
                throw new Error('No se ha seleccionado ningún artículo');
            }
            const res = await fetchWithAuth(url, method, {
                movimiento: data, renglones: movimientoRenlones
            });
            const resJson = await res.json();
            if (!res.ok) {
                throw new Error(resJson['error']);
            }
            setSnackbar({
                message: 'Movimiento de stock guardado correctamente',
                severity: 'success',
                autoHideDuration: 4000,
                onClose: () => handleCloseSnackbar(true)
            });
        } catch (e) {
            console.error('Error al guardar el movimiento de stock:', e);
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
        if (errors['fecha_hora'] || errors['tipo_movimiento'] || errors['origen']) {
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
                                                label="Fecha de Movimiento"
                                                value={field.value ? dayjs(field.value) : null}
                                                onChange={(value) => field.onChange(value)}
                                            />
                                        </LocalizationProvider>
                                    )}
                                />
                                <FormHelperText>{errors.fecha_hora && errors.fecha_hora.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth required error={Boolean(errors.tipo_movimiento)}>
                                <InputLabel id="tipo_movimiento_label">Tipo de Movimiento</InputLabel>
                                <Controller
                                    name="tipo_movimiento"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            id="tipo_movimiento"
                                            labelId="tipo_movimiento_label"
                                            label="Tipo de Movimiento"
                                        >
                                            {selectOptions.tipo_movimiento.map((item) => (
                                                <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>))}
                                        </Select>
                                    )}
                                />
                                <FormHelperText>{errors.tipo_movimiento && errors.tipo_movimiento.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth required error={Boolean(errors.origen)}>
                                <InputLabel id="origen_label">Origen</InputLabel>
                                <Controller
                                    name="origen"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            id="origen"
                                            labelId="origen_label"
                                            label="Origen"
                                        >
                                            {selectOptions.origen.map((item) => (
                                                <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>))}
                                        </Select>
                                    )}
                                />
                                <FormHelperText>{errors.punto_venta_id && errors.punto_venta_id.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Artículos</Typography>
                    <Box sx={{ height: 500, width: '100%', '& .disabled-cell': { backgroundColor: '#f5f5f5' } }}>
                        <DataGrid
                            columns={[
                                {
                                    field: 'codigo_principal',
                                    headerName: 'Código Principal',
                                    flex: 2,
                                    editable: false,
                                    cellClassName: () => 'disabled-cell'
                                },
                                {
                                    field: 'descripcion',
                                    headerName: 'Descripción',
                                    flex: 2,
                                    editable: false,
                                    cellClassName: () => 'disabled-cell'
                                },
                                {
                                    field: 'cantidad',
                                    headerName: 'Cantidad',
                                    flex: 1,
                                    type: 'number',
                                    editable: true,
                                    valueFormatter: (value) => {
                                        return new Intl.NumberFormat('es-AR').format(value);
                                    }
                                }
                            ]}
                            rows={movimientoRenlones}
                            getRowId={(row) => row.articulo_id}
                            disableRowSelectionOnClick
                            slots={{
                                toolbar: () => <CustomToolbar onOpen={setOpenArticuloDialog} />,
                            }}
                            processRowUpdate={(newRow, oldRow) => {
                                const updatedRows = movimientoRenlones.map((row) => {
                                    if (row.articulo_id === oldRow.articulo_id) {                                  
                                        return { ...newRow };
                                    }
                                    return row;
                                });
                                setMovimientoRenglones(updatedRows);
                                return newRow;
                            }}
                            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                        />
                    </Box>
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
            <ArticuloSelectorDialog
                open={openArticuloDialog}
                onClose={() => setOpenArticuloDialog(false)}
                selectedArticulo={selectedArticulo}
                setSelectedArticulo={setSelectedArticulo}
                renglones={movimientoRenlones}
                setRenglones={setMovimientoRenglones}
                allowCreate={true}
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