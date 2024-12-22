import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Autocomplete,
    Box,
    Button,
    FormControl,
    Grid,
    Paper,
    Tab,
    Tabs,
    TextField,
    Typography
} from "@mui/material";
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import 'dayjs/locale/es';
import SaveIcon from '@mui/icons-material/Save';
import { API } from "../../App";
import SimpleTabPanel from "../shared/SimpleTabPanel";
import AddIcon from "@mui/icons-material/Add";
import SnackbarAlert from "../shared/SnackbarAlert";
import ArticuloSelectorDialog from "../shared/ArticuloSelectorDialog";
import { esES } from "@mui/x-data-grid/locales";
import fetchWithAuth from '../../utils/fetchWithAuth';
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

export default function OrdenVentaForm({ pk }) {
    const {
        handleSubmit,
        control,
        formState: { errors },
        setValue
    } = useForm();
    const [selectOptions, setSelectOptions] = useState({
        cliente: [],
        alicuota_iva: []
    });
    const [tabValue, setTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [openArticuloDialog, setOpenArticuloDialog] = useState(false);
    const [selectedArticulo, setSelectedArticulo] = useState([]);
    const [ventaItems, setVentaItems] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { withLoading } = useLoading();

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    }

    const handleCloseSnackbar = (redirect, url = '/ventas-orden') => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = url;
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            const url = Boolean(pk) ? `${API}/ventas-orden/${pk}/update` : `${API}/ventas-orden/create`;
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
                    cliente: data.clientes,
                    alicuota_iva: data.alicuota_iva
                });
                setValue('cliente', data.clientes[0].value);
                if (Boolean(pk)) {
                    const venta = data['venta'];
                    setValue('cliente', venta.cliente);
                    if (venta.observacion) setValue('observacion', venta.observacion);

                    // Cargar renglones de venta
                    const renglonesArray = venta['items'].map((r) => {
                        return {
                            articulo_id: r.articulo_id,
                            descripcion: r.descripcion,
                            cantidad: r.cantidad,
                            precio_unidad: r.precio_unidad,
                            alicuota_iva: r.alicuota_iva,
                            subtotal_iva: r.subtotal_iva,
                            subtotal_gravado: r.subtotal_gravado,
                            subtotal: r.subtotal,
                        };
                    });
                    const articuloArray = renglonesArray.map((r) => r.articulo_id);
                    setVentaItems(renglonesArray);
                    setSelectedArticulo(articuloArray);
                }
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
    }, [pk, setValue, withLoading]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        const url = Boolean(pk) ? `${API}/ventas-orden/${pk}/update` : `${API}/ventas-orden/create`;
        const method = Boolean(pk) ? 'PUT' : 'POST';
        try {
            if (ventaItems.length === 0) {
                throw new Error('No se ha seleccionado ningún artículo');
            }
            data['items'] = ventaItems;
            const res = await fetchWithAuth(url, method, data);
            const resJson = await res.json();
            if (!res.ok) {
                if (res.status === 409) {
                    throw new Error(JSON.stringify(resJson));
                }
                throw new Error(resJson['error']);
            }
            setSnackbar({
                message: 'Orden de Venta guardada correctamente',
                severity: 'success',
                autoHideDuration: 4000,
                onClose: () => handleCloseSnackbar(true)
            });
        } catch (e) {
            console.error('Error al guardar la orden de venta:', e);
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
        if (errors['cliente']) {
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
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Controller
                                    name="cliente"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Este campo es requerido" }}
                                    render={({ field }) => (
                                        <Autocomplete
                                            {...field}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    required
                                                    label="Seleccionar Cliente"
                                                    variant="outlined"
                                                    error={Boolean(errors.cliente)}
                                                    helperText={errors.cliente && errors.cliente.message}
                                                />
                                            )}
                                            options={selectOptions.cliente}
                                            getOptionLabel={(option) => option.label ? option.label : ''}
                                            getOptionKey={(option) => option.value}
                                            value={selectOptions.cliente.find((c) => c.value === field.value) || ""}
                                            isOptionEqualToValue={(option, value) =>
                                                value === undefined || value === "" || option.value === value.value
                                            }
                                            onChange={(event, value) => {
                                                field.onChange(value ? value.value : "");
                                            }}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Renglones de Venta</Typography>
                    <Box sx={{
                        height: 500,
                        width: '100%',
                        '& .font-weight-bold': { fontWeight: '700' },
                        '& .disabled-cell': { backgroundColor: '#f5f5f5' }
                    }}
                    >
                        <DataGrid
                            columns={[
                                {
                                    field: 'descripcion',
                                    headerName: 'Descripción',
                                    flex: 2,
                                    editable: true,
                                    valueFormatter: (value) => {
                                        return value.length > 30 ? `${value.substring(0, 30)}...` : value;
                                    }
                                },
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
                                    field: 'alicuota_iva',
                                    headerName: 'IVA (%)',
                                    flex: 0.5,
                                    type: 'singleSelect',
                                    editable: true,
                                    valueOptions: selectOptions.alicuota_iva.map((item) => (
                                        { value: item.porcentaje, label: `${item.porcentaje}%` }
                                    )),
                                    valueFormatter: (value) => {
                                        return new Intl.NumberFormat('es-AR').format(value);
                                    }
                                },
                                {
                                    field: 'subtotal_iva',
                                    headerName: 'Importe IVA',
                                    flex: 0.5,
                                    type: 'number',
                                    editable: false,
                                    valueFormatter: (value) => {
                                        return new Intl.NumberFormat('es-AR', {
                                            style: 'currency',
                                            currency: 'ARS'
                                        }).format(value);
                                    },
                                    cellClassName: () => 'disabled-cell'
                                },
                                {
                                    field: 'subtotal_gravado',
                                    headerName: 'Importe Gravado',
                                    flex: 0.5,
                                    type: 'number',
                                    editable: false,
                                    valueFormatter: (value) => {
                                        return new Intl.NumberFormat('es-AR', {
                                            style: 'currency',
                                            currency: 'ARS'
                                        }).format(value);
                                    },
                                    cellClassName: () => 'disabled-cell'
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
                                    },
                                    cellClassName: () => {
                                        return 'font-weight-bold disabled-cell';
                                    }
                                },
                            ]}
                            rows={ventaItems}
                            getRowId={(row) => row.articulo_id}
                            disableRowSelectionOnClick
                            slots={{
                                toolbar: () => <CustomToolbar onOpen={setOpenArticuloDialog} />,
                            }}
                            processRowUpdate={(newRow, oldRow) => {
                                const updatedRows = ventaItems.map((row) => {
                                    if (row.articulo_id === oldRow.articulo_id) {
                                        const iva = parseFloat(newRow.alicuota_iva);
                                        newRow.subtotal = newRow.cantidad * newRow.precio_unidad;
                                        newRow.subtotal_iva = newRow.subtotal * iva / (100 + iva);
                                        newRow.subtotal_gravado = newRow.subtotal - newRow.subtotal_iva;
                                        return { ...newRow };
                                    }
                                    return row;
                                });
                                setVentaItems(updatedRows);
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
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Totales</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography>Artículos: {ventaItems.reduce((acc, row) => acc + Number(row.cantidad), 0)}</Typography>
                                <Typography>Importe de IVA: {ventaItems.reduce((acc, row) => acc + Number(row.subtotal_iva), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</Typography>
                                <Typography>Importe Gravado: {ventaItems.reduce((acc, row) => acc + Number(row.subtotal_gravado), 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</Typography>
                                <Typography fontWeight={700}>Importe Total: {(ventaItems.reduce((acc, row) => acc + Number(row.subtotal), 0)).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</Typography>
                            </Grid>
                        </Grid>
                    </Box>
                    <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'right', mt: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                type="button"
                                onClick={handleSubmit(onSubmit, onError)}
                                disabled={isSubmitting}
                            >
                                Guardar Orden de Venta
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Paper>
            <ArticuloSelectorDialog
                open={openArticuloDialog}
                onClose={() => setOpenArticuloDialog(false)}
                selectedArticulo={selectedArticulo}
                setSelectedArticulo={setSelectedArticulo}
                items={ventaItems}
                setItems={setVentaItems}
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