import React, {useEffect, useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormHelperText,
    Grid,
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
import {DateTimePicker, LocalizationProvider} from '@mui/x-date-pickers';
import {DataGrid, GridToolbarContainer, useGridApiRef} from '@mui/x-data-grid';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb';
import SaveIcon from '@mui/icons-material/Save';
import {API} from "../../App";
import Divider from "@mui/material/Divider";
import SimpleTabPanel from "../shared/SimpleTabPanel";
import AddIcon from "@mui/icons-material/Add";
import Dialog from "@mui/material/Dialog";


export default function VentaForm({pk}) {
    const {
        handleSubmit,
        control,
        formState: {errors},
        setValue
    } = useForm();
    const [selectOptions, setSelectOptions] = useState({
        cliente: [],
        tipo_comprobante: [],
    });
    const [tabValue, setTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        onClose: () => handleCloseSnackbar(false)
    });
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const [openArticuloDialog, setOpenArticuloDialog] = useState(false);
    const [listArticulo, setListArticulo] = useState([]);
    const [selectedArticulo, setSelectedArticulo] = useState([]);

    const CustomToolbar = () => {
        return (
            <GridToolbarContainer>
                <Button
                    startIcon={<AddIcon/>}
                    size="small"
                    variant="contained"
                    onClick={() => setOpenArticuloDialog(true)}
                >Seleccionar Artículos
                </Button>
            </GridToolbarContainer>
        );
    }

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    }

    const handleCloseSnackbar = (redirect) => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = '/ventas';
        }
    }

    const fetchData = async () => {
        if (Boolean(pk) === false) {
            const res = await fetch(`${API}/ventas/create`);
            return await res.json();
        } else {
            const res = await fetch(`${API}/ventas/${pk}/update`);
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
                    cliente: selectOptions.cliente,
                    tipo_comprobante: selectOptions.tipo_comprobante,
                });
            }
        });
    }, []);

    const fetchArticulos = async () => {
        const res = await fetch(`${API}/articulos`);
        return await res.json();
    }

    // useEffect para cargar los artículos cuando se abre el diálogo
    useEffect(() => {
        if (openArticuloDialog) {
            fetchArticulos().then(data => {
                setListArticulo(data['articulos']);
            });
        }
    }, [openArticuloDialog]);

    const onSubmit = (data) => {
        const rowsArray = Array.from(ventaRenglonesGridApiRef.current.getRowModels().values());
        if (rowsArray.length === 0) {
            alert('No se ha seleccionado ningún artículo');
            return;
        }
        data['renglones'] = rowsArray
    }

    const onError = (errors) => {
        alert(JSON.stringify(errors));
    }

    const ventaRenglonesGridApiRef = useGridApiRef();

    return (
        <>
            <Paper elevation={3} component="form" onSubmit={handleSubmit(onSubmit, onError)} noValidate
                   sx={{mt: 2, padding: 2}}>
                <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                    <Tabs value={tabValue} onChange={handleTabChange} centered>
                        <Tab label="Principal"/>
                        <Tab label="Dirección"/>
                    </Tabs>
                </Box>
                <SimpleTabPanel value={tabValue} index={0}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <Controller
                                    name="cliente_id"
                                    control={control}
                                    defaultValue=""
                                    rules={{required: "Este campo es requerido"}}
                                    render={({field}) => (
                                        <Autocomplete
                                            {...field}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    required
                                                    label="Seleccionar Cliente"
                                                    variant="outlined"
                                                    error={Boolean(errors.cliente_id)}
                                                    helperText={errors.cliente_id && errors.cliente_id.message}
                                                />
                                            )}
                                            options={selectOptions.cliente}
                                            getOptionLabel={(option) => option.razon_social ? option.razon_social : ''}
                                            getOptionKey={(option) => option.id}
                                            value={selectOptions.cliente.find((c) => c.id === field.value) || ""}
                                            isOptionEqualToValue={(option, value) =>
                                                value === undefined || value === "" || option.id === value.id
                                            }
                                            onChange={(event, value) => {
                                                field.onChange(value ? value.id : null);
                                            }}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                    <br/>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <FormControl fullWidth required error={Boolean(errors.tipo_comprobante_id)}>
                                <InputLabel id="tipo_comprobante_label">Tipo de Comprobante</InputLabel>
                                <Controller
                                    name="tipo_comprobante_id"
                                    control={control}
                                    defaultValue=""
                                    rules={{required: "Este campo es requerido"}}
                                    render={({field}) => (
                                        <Select
                                            {...field}
                                            id="tipo_comprobante"
                                            labelId="tipo_comprobante_label"
                                            label="Tipo de Comprobante"
                                        >
                                            {selectOptions.tipo_comprobante.map((item) => (
                                                <MenuItem key={item.id} value={item.id}>{item.descripcion}</MenuItem>))}
                                        </Select>
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth error={Boolean(errors.fecha_hora)}>
                                <Controller
                                    name="fecha_hora"
                                    control={control}
                                    defaultValue={null}
                                    render={({field}) => (
                                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'en-gb'}>
                                            <DateTimePicker
                                                {...field}
                                                label="Fecha de Emisión"
                                                value={field.value ? dayjs(field.value) : null}
                                                onChange={(value) => field.onChange(value)}
                                            />
                                        </LocalizationProvider>
                                    )}
                                />
                                <FormHelperText>{errors.fecha_hora && errors.fecha_hora.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Divider sx={{mt: 2}}/>
                    <Typography variant="h6" sx={{mt: 2}}>Renglones de Venta</Typography>
                    <div style={{height: 400, width: '100%'}}>
                        <DataGrid
                            apiRef={ventaRenglonesGridApiRef}
                            columns={[
                                {field: 'articulo_id', headerName: 'ID Artículo', width: 75},
                                {field: 'descripcion', headerName: 'Descripción', width: 500},
                                {field: 'cantidad', headerName: 'Cantidad', width: 100},
                                {field: 'precio_unitario', headerName: 'Precio Unitario', width: 150},
                                {field: 'precio_total', headerName: 'Precio Total', width: 150},
                            ]}
                            rows={listArticulo.filter((item) => selectedArticulo.includes(item.id)).map((item) => {
                                return {
                                    articulo_id: item.id,
                                    descripcion: item.descripcion,
                                    cantidad: 1,
                                    precio_unitario: 0,
                                    precio_total: 0,
                                }
                            })}
                            getRowId={(row) => row.articulo_id}
                            pageSize={5}
                            rowsPerPageOptions={[5]}
                            disableSelectionOnClick
                            slots={{toolbar: CustomToolbar}}
                        />
                    </div>
                </SimpleTabPanel>
                <SimpleTabPanel value={tabValue} index={1}>
                    <Grid container spacing={2}>
                    </Grid>
                </SimpleTabPanel>
                <Box sx={{display: 'flex', justifyContent: 'right', mt: 2}}>
                    <Button variant="contained" startIcon={<SaveIcon/>} type="submit">
                        Guardar
                    </Button>
                </Box>
            </Paper>
            <Dialog
                open={openArticuloDialog}
                onClose={() => setOpenArticuloDialog(false)}
                fullWidth={true}
                maxWidth={'md'}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">Seleccionar Artículos</DialogTitle>
                <DialogContent dividers>
                    <div style={{height: 400, width: '100%'}}>
                        <DataGrid
                            columns={[
                                {field: 'id', headerName: 'ID', width: 75},
                                {field: 'descripcion', headerName: 'Descripción', width: 500},
                            ]}
                            rows={listArticulo.map(item => {
                                return {
                                    id: item.id,
                                    descripcion: item.descripcion,
                                }
                            })}
                            rowHeight={30}
                            pageSize={5}
                            rowsPerPageOptions={[5, 10, 20]}
                            checkboxSelection
                            onRowSelectionModelChange={(newSelection) => {
                                setSelectedArticulo(newSelection);
                            }}
                            rowSelectionModel={selectedArticulo}
                        />
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button
                        color="primary"
                        onClick={() => {
                            setOpenArticuloDialog(false);
                        }}
                    >
                        Aceptar
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={snackbar.onClose}>
                <Alert onClose={snackbar.onClose} severity={snackbar.severity} sx={{width: '100%'}}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}