import React, {useState, useEffect} from "react";
import Container from "@mui/material/Container";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import Box from "@mui/material/Box";
import Header from "./components/shared/Header";
import VentaPage from './pages/venta/VentaPage';
import VentaFormPage from './pages/venta/VentaFormPage';
import ClientePage from './pages/cliente/ClientePage';
import ClienteFormPage from './pages/cliente/ClienteFormPage';


export const API = process.env.REACT_APP_API_URL;

function App() {
    return (
        <Router>
            <Box sx={{display: 'flex'}}>
                <Header/>
                <Container sx={{mt: 8}}>
                    <Routes>
                        <Route path="/ventas" element={<VentaPage/>}></Route>
                        <Route path="/ventas/form" element={<VentaFormPage/>}></Route>
                        <Route path="/ventas/form/:pk" element={<VentaFormPage/>}></Route>
                        <Route path="/clientes" element={<ClientePage/>}></Route>
                        <Route path="/clientes/form" element={<ClienteFormPage/>}></Route>
                        <Route path="/clientes/form/:pk" element={<ClienteFormPage/>}></Route>
                    </Routes>
                </Container>
            </Box>
        </Router>
    )
}

export default App;