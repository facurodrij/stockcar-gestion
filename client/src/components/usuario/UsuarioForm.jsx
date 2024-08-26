import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Box,
    Button,
    FormControl,
    Grid,
    Paper,
    TextField,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Typography
} from "@mui/material";
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import SaveIcon from '@mui/icons-material/Save';
import { API } from "../../App";
import SimpleTabPanel from "../shared/SimpleTabPanel";
import AddIcon from "@mui/icons-material/Add";
import SnackbarAlert from "../shared/SnackbarAlert";
import ArticuloSelectorDialog from "../shared/ArticuloSelectorDialog";
import { esES } from "@mui/x-data-grid/locales";
import InputAdornment from '@mui/material/InputAdornment';
import TributoDataGrid from "../tributo/TributoDataGrid";
import fetchWithAuth from '../../utils/fetchWithAuth';


export default function UsuarioForm({ pk }) {
    const {
        handleSubmit,
        control,
        formState: { errors },
        setValue
    } = useForm();
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCloseSnackbar = (redirect, url = '/usuarios') => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = url;
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            const url = Boolean(pk) ? `${API}/usuarios/${pk}/update` : `${API}/usuarios/create`;
            const res = await fetchWithAuth(url);
            if (!res.ok) {
                const message = Boolean(pk) ? 'Error al obtener la venta' : 'Error al obtener los datos';
                throw new Error(message);
            }
            return await res.json();
        }
        const loadData = async () => {
            try {
                const data = await fetchData();
                const selectOptions = data['select_options'];
                setAvailablePermissions(selectOptions['permisos']);
                if (Boolean(pk)) {
                    const usuario = data['usuario'];
                    const permisos = usuario['permisos']
                    setValue('username', usuario['username']);
                    setValue('email', usuario['email']);
                    setValue('password', usuario['password']);
                    setValue('is_superuser', usuario['is_superuser']);
                    if (usuario['nombre']) setValue('nombre', usuario['nombre']);
                    if (usuario['apellido']) setValue('apellido', usuario['apellido']);
                    setSelectedPermissions([]);
                    permisos.forEach((p) => {
                        setSelectedPermissions(selectedPermissions => [...selectedPermissions, p.id]);
                    });
                }
            } catch (e) {
                console.error('Error en la carga de datos:', e);
                setSnackbar({
                    message: 'Error al cargar los datos',
                    severity: 'error',
                    onClose: () => handleCloseSnackbar(false)
                });
                setOpenSnackbar(true);
            }
        }

        loadData();
    }, [pk, setValue]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        const url = Boolean(pk) ? `${API}/usuarios/${pk}/update` : `${API}/usuarios/create`;
        const method = Boolean(pk) ? 'PUT' : 'POST';
        try {
            const response = await fetchWithAuth(url, method, {
                usuario: data, permisos: selectedPermissions
            });
            const responseJson = await response.json();
            if (!response.ok) {
                throw new Error(`${responseJson['error']}`);
            }
            setSnackbar({
                message: 'Usuario guardado correctamente',
                severity: 'success',
                autoHideDuration: 4000,
                onClose: () => handleCloseSnackbar(true)
            });
        } catch (e) {
            setSnackbar({
                message: e.message,
                severity: 'error',
                autoHideDuration: null, // No cerrar el snackbar
                onClose: () => handleCloseSnackbar(false)
            });
            setIsSubmitting(false);
        } finally {
            setOpenSnackbar(true);
        }
    }

    return (
        <>
            <Paper elevation={3} component="form" onSubmit={handleSubmit(onSubmit)} noValidate
                sx={{ mt: 2, padding: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <Controller
                                name="username"
                                control={control}
                                defaultValue=""
                                rules={{ required: 'El nombre de usuario es requerido' }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        required
                                        label="Username"
                                        variant="outlined"
                                        error={Boolean(errors.username)}
                                        helperText={errors.username ? errors.username.message : ''}
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
                                    required: 'El email es requerido',
                                    pattern: {
                                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                                        message: "Email inválido"
                                    }
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        required
                                        label="Email"
                                        variant="outlined"
                                        error={Boolean(errors.email)}
                                        helperText={errors.email ? errors.email.message : ''}
                                    />
                                )}
                            />
                        </FormControl>
                    </Grid>
                </Grid>
                <br />
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <Controller
                                name="password"
                                control={control}
                                defaultValue=""
                                rules={{ required: 'La contraseña es requerida' }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        required
                                        label="Contraseña"
                                        variant="outlined"
                                        error={Boolean(errors.password)}
                                        helperText={errors.password ? errors.password.message : ''}
                                    />
                                )}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={3}>
                        <FormControl component="fieldset" variant="standard">
                            <FormGroup>
                                <Controller
                                    name="is_superuser"
                                    control={control}
                                    defaultValue={false}
                                    render={({ field: { onChange, value } }) => (
                                        <FormControlLabel
                                            control={<Checkbox checked={value} onChange={onChange} />}
                                            label="Superusuario"
                                        />
                                    )}
                                />
                            </FormGroup>
                        </FormControl>
                    </Grid>
                </Grid>
                <br />
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <Controller
                                name="nombre"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Nombre"
                                        variant="outlined"
                                        error={Boolean(errors.nombre)}
                                        helperText={errors.nombre ? errors.nombre.message : ''}
                                    />
                                )}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <Controller
                                name="apellido"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Apellido"
                                        variant="outlined"
                                        error={Boolean(errors.apellido)}
                                        helperText={errors.apellido ? errors.apellido.message : ''}
                                    />
                                )}
                            />
                        </FormControl>
                    </Grid>
                </Grid>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Seleccionar Permisos</Typography>
                <Box sx={{ height: 500, width: '100%' }}>
                    <DataGrid
                        columns={[
                            { field: 'nombre', headerName: 'Nombre', flex: 2 },
                            { field: 'descripcion', headerName: 'Descripción', flex: 2 },
                        ]}
                        rows={availablePermissions}
                        checkboxSelection
                        rowSelectionModel={selectedPermissions}
                        onRowSelectionModelChange={(newRowSelectionModel) => {
                            setSelectedPermissions(newRowSelectionModel)
                        }}
                        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    />
                </Box>
                <br />
                <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'right', mt: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            type="button"
                            onClick={handleSubmit(onSubmit)}
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