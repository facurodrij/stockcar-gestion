import React, {useState, useEffect} from "react";
import Container from "@mui/material/Container";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import VentasIndex from './pages/Ventas';
import Box from "@mui/material/Box";
import Header from "./components/Header";


function App() {
    return (
        <Router>
            <Box sx={{ display: 'flex' }}>
                <Header/>
                <Container>
                    <Routes>
                        <Route path="/ventas" element={<VentasIndex/>}></Route>
                    </Routes>
                </Container>
            </Box>
        </Router>
    )
}

export default App;