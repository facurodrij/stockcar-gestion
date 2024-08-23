import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import { API } from "../../App";
import { checkAuth } from '../../utils/checkAuth';

export default function ProfilePage() {
    const [profileData, setProfileData] = useState(null);

    const getProfileData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API}/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setProfileData(data['user']);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        checkAuth();
        getProfileData();
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
                {profileData && profileData.email}
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
                {profileData && profileData.username}
            </Typography>
        </>
    )
}
