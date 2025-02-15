import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import { API } from "../../App";
import { checkAuth } from '../../utils/checkAuth';
import fetchWithAuth from '../../utils/fetchWithAuth';
import SnackbarAlert from '../../components/shared/SnackbarAlert';


export default function ProfilePage() {
    const [profile, setProfile] = useState({
        email: '',
        username: '',
        nombre: '',
        apellido: '',
    });
    const [snackbar, setSnackbar] = useState({
        message: '',
        severity: 'success',
        autoHideDuration: 4000,
        onClose: () => handleCloseSnackbar(false)
    });
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const handleCloseSnackbar = (redirect) => {
        setOpenSnackbar(false);
        if (redirect) {
            window.location.href = '/';
        };
    };

    const fetchData = async () => {
        try {
            const url = `${API}/profile`;
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                const message = `Error al obtener datos: ${data['error']}`
                throw new Error(message);
            };
            setProfile(data);
            console.log('Datos cargados:', data);
        } catch (e) {
            console.error('Error en la carga de datos:', e);
            setSnackbar({
                message: e.message,
                severity: 'error',
                onClose: () => handleCloseSnackbar(false)
            });
            setOpenSnackbar(true);
        };
    };

    useEffect(() => {
        checkAuth();
        fetchData();
    }, []);

    return (
        <>
            <Typography
                variant="h4"
                sx={{
                    mt: 2,
                    mb: 2,
                    fontFamily: 'roboto',
                    color: 'inherit'
                }}
            >
                Perfil
            </Typography>
            <Typography
                variant="h6"
                sx={{
                    mt: 2,
                    mb: 2,
                    fontFamily: 'roboto',
                    color: 'inherit'
                }}
            >
                {profile && profile.nombre} {profile && profile.apellido}
            </Typography>
            <Typography
                variant="h6"
                sx={{
                    mt: 2,
                    mb: 2,
                    fontFamily: 'roboto',
                    color: 'inherit'
                }}
            >
                {profile && profile.email}
            </Typography>
            <SnackbarAlert
                open={openSnackbar}
                autoHideDuration={snackbar.autoHideDuration}
                onClose={snackbar.onClose}
                severity={snackbar.severity}
                message={snackbar.message}
            />
        </>
    )
}
