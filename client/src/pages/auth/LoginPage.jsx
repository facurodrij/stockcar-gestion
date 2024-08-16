import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import { API } from "../../App";


export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const response = await fetch(`${API}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            localStorage.setItem('token', data.access_token);
            // Get argument from URL redirect_to
            const urlParams = new URLSearchParams(window.location.search);
            const redirect_to = urlParams.get('redirect_to');
            if (redirect_to) {
                window.location.href = redirect_to;
            }
            window.location.href = '/';
        } catch (error) {
            console.error(error);
        }
    };

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
                Iniciar sesión
            </Typography>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>
        </>
    )
}
