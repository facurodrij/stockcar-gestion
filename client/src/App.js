import React from "react";
import Container from "@mui/material/Container";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import Box from "@mui/material/Box";
import Header from "./components/shared/Header";
import VentaPage from './pages/venta/VentaPage';
import VentaFormPage from './pages/venta/VentaFormPage';
import VentaDetailPage from "./pages/venta/VentaDetailPage";
import OrdenVentaFormPage from './pages/venta/OrdenVentaFormPage';
import ClientePage from './pages/cliente/ClientePage';
import ClienteFormPage from './pages/cliente/ClienteFormPage';
import ArticuloPage from './pages/articulo/ArticuloPage';
import ArticuloFormPage from './pages/articulo/ArticuloFormPage';
import ComercioPage from './pages/comercio/ComercioPage';
import ComercioFormPage from './pages/comercio/ComercioFormPage';
import LoginPage from "./pages/auth/LoginPage";
import ProfilePage from "./pages/auth/ProfilePage";
import Unauthorized from "./pages/auth/Unauthorized";
import UsuarioPage from "./pages/usuario/UsuarioPage";
import UsuarioFormPage from "./pages/usuario/UsuarioFormPage";


export const API = process.env.REACT_APP_API_URL;

function App() {
    return (
        <Router>
            <Box sx={{display: 'flex'}}>
                <Header/>
                <Container sx={{mt: 8}}>
                    <Routes>
                        <Route path="/login" element={<LoginPage/>}></Route>
                        <Route path="/profile" element={<ProfilePage/>}></Route>
                        <Route path="/unauthorized" element={<Unauthorized/>}></Route>
                        <Route path="/ventas" element={<VentaPage/>}></Route>
                        <Route path="/ventas/:pk" element={<VentaDetailPage/>}></Route>
                        <Route path="/ventas/form" element={<VentaFormPage/>}></Route>
                        <Route path="/ventas/form/:pk" element={<VentaFormPage/>}></Route>
                        <Route path="/ventas/orden" element={<OrdenVentaFormPage/>}></Route>
                        <Route path="/ventas/orden/:pk" element={<OrdenVentaFormPage/>}></Route>
                        <Route path="/clientes" element={<ClientePage/>}></Route>
                        <Route path="/clientes/form" element={<ClienteFormPage/>}></Route>
                        <Route path="/clientes/form/:pk" element={<ClienteFormPage/>}></Route>
                        <Route path="/articulos" element={<ArticuloPage/>}></Route>
                        <Route path="/articulos/form" element={<ArticuloFormPage/>}></Route>
                        <Route path="/articulos/form/:pk" element={<ArticuloFormPage/>}></Route>
                        <Route path="/comercios" element={<ComercioPage/>}></Route>
                        <Route path="/comercios/form" element={<ComercioFormPage/>}></Route>
                        <Route path="/comercios/form/:pk" element={<ComercioFormPage/>}></Route>
                        <Route path="/usuarios" element={<UsuarioPage/>}></Route>
                        <Route path="/usuarios/form" element={<UsuarioFormPage/>}></Route>
                        <Route path="/usuarios/form/:pk" element={<UsuarioFormPage/>}></Route>
                    </Routes>
                </Container>
            </Box>
        </Router>
    )
}

export default App;