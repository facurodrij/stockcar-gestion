import React, {useState, useEffect} from "react";
import Container from "@mui/material/Container";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import Box from "@mui/material/Box";
import Header from "./components/Header";
import VentaIndex from './pages/venta';
import ClienteIndex from './pages/cliente';


export const API = process.env.REACT_APP_API_URL;

function App() {
    return (
        <Router>
            <Box sx={{display: 'flex'}}>
                <Header/>
                <Container sx={{mt: 8}}>
                    <Routes>
                        <Route path="/ventas" element={<VentaIndex/>}></Route>
                        <Route path="/clientes" element={<ClienteIndex/>}></Route>
                    </Routes>
                </Container>
            </Box>
        </Router>
    )
}

export default App;