import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Box,
    Button,
    FormControl,
    Grid,
    InputAdornment,
    Paper,
    TextField,
    Typography,
    IconButton,
    OutlinedInput,
    InputLabel,
    FormHelperText
} from "@mui/material";
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { API } from "../../App";
import SnackbarAlert from '../../components/shared/SnackbarAlert';


export default function LoginPage() {
    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm();
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleMouseUpPassword = (event) => {
        event.preventDefault();
    };

    const handleCloseSnackbar = (redirect, url = '/ventas') => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = url;
        }
    }

    const onSubmit = async (data) => {
        try {
            const response = await fetch(`${API}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: data.username, password: data.password })
            });
            const responseJson = await response.json();
            if (!response.ok) {
                throw new Error(`Error: ${responseJson['error']}`);
            }
            localStorage.setItem('token', responseJson.access_token);
            localStorage.setItem('user', JSON.stringify(responseJson.user));
            localStorage.setItem('permissions', JSON.stringify(responseJson.permissions));
            // Get argument from URL redirect_to
            const urlParams = new URLSearchParams(window.location.search);
            const redirect_to = urlParams.get('redirect_to');
            if (redirect_to) {
                window.location.href = redirect_to;
            }
            window.location.href = '/';
        } catch (e) {
            setSnackbar({
                message: e.message,
                severity: 'error',
                autoHideDuration: null,
                onClose: () => handleCloseSnackbar(false)
            });
            setOpenSnackbar(true);
        }
    };

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="50vh"
        >
            <Paper elevation={3} component="form" onSubmit={handleSubmit(onSubmit)} noValidate
                sx={{ mt: 2, padding: 2, width: '100%', maxWidth: 400 }}>
                <Typography
                    variant="h4"
                    sx={{
                        mt: 2,
                        mb: 2,
                        fontFamily: 'roboto',
                        color: 'inherit'
                    }}
                >
                    Iniciar sesión
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <Controller
                                name="username"
                                control={control}
                                defaultValue=""
                                rules={{ required: "Este campo es requerido" }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        required
                                        id="username"
                                        label="Nombre de Usuario"
                                        variant="outlined"
                                        error={Boolean(errors.username)}
                                        helperText={errors.username && errors.username.message}
                                    />
                                )}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth required error={Boolean(errors.password)}>
                            <Controller
                                name="password"
                                control={control}
                                defaultValue=""
                                rules={{ required: "Este campo es requerido" }}
                                render={({ field }) => (
                                    <>
                                        <InputLabel htmlFor="password">Contraseña</InputLabel>
                                        <OutlinedInput
                                            {...field}
                                            id="password"
                                            label="Contraseña"
                                            type={showPassword ? 'text' : 'password'}
                                            endAdornment={
                                            <InputAdornment position="end">
                                                <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={handleClickShowPassword}
                                                onMouseDown={handleMouseDownPassword}
                                                onMouseUp={handleMouseUpPassword}
                                                edge="end"
                                                >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                            }
                                        />
                                    </>
                                )}
                            />
                            <FormHelperText>{errors.password && errors.password.message}</FormHelperText>
                        </FormControl>
                    </Grid>
                </Grid>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit(onSubmit)}
                    sx={{ mt: 4, width: '100%' }}
                >
                    Iniciar sesión
                </Button>
            </Paper>
            <SnackbarAlert {...snackbar} open={openSnackbar} />
        </Box>
    )
}
