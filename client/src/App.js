import React, {useState, useEffect} from "react";
import Container from "@mui/material/Container";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import AppBar from "./components/AppBar";
import './App.css';
import VentasIndexPage from './pages/Ventas/IndexPage';

function App() {
    return (
        <Router>
            <AppBar/>
            <Container>
                <Routes>
                    <Route path="/ventas" element={<VentasIndexPage/>}></Route>
                </Routes>
            </Container>
        </Router>
    )
}

export default App;