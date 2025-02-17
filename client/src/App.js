import React from "react";
import Container from "@mui/material/Container";
import { BrowserRouter as Router } from "react-router-dom";
import Box from "@mui/material/Box";
import Header from "./components/shared/Header";
import AuthRoutes from "./config/routes/auth";
import CoreRoutes from "./config/routes/core";

export const API = process.env.REACT_APP_API_URL;

function App() {
    return (
        <Router>
            <Box sx={{ display: 'flex' }}>
                <Header />
                <Container sx={{ mt: 8 }}>
                    <AuthRoutes />
                    <CoreRoutes />
                </Container>
            </Box>
        </Router>
    )
}

export default App;