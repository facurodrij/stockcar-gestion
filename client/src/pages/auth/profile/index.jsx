import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import { API } from '../../../App';
import checkAuth from '../../../config/auth/checkAuth';
import fetchWithAuth from '../../../config/auth/fetchWithAuth';
import SnackbarAlert from '../../../common/components/SnackbarAlert';

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

    useEffect(() => {
        checkAuth();
        const fetchData = async () => {
            const url = `${API}/profile`;
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (!res.ok) {
                const message = `Error al obtener datos: ${data['error']}`
                throw new Error(message);
            };
            return data;
        }
        const loadData = async () => {
            try {
                const data = await fetchData();
                setProfile(data);
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
        
        loadData();
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
