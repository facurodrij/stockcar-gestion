import React from "react";
import { Route, Routes } from "react-router-dom";
import LoginPage from "../../../pages/auth/login";
import ProfilePage from "../../../pages/auth/profile";
import Unauthorized from "../../../pages/auth/unauthorized";
import UsuarioList from "../../../pages/auth/usuario/components/list";
import UsuarioForm from "../../../pages/auth/usuario/components/form";

export default function AuthRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />}></Route>
            <Route path="/profile" element={<ProfilePage />}></Route>
            <Route path="/unauthorized" element={<Unauthorized />}></Route>
            <Route path="/usuarios" element={<UsuarioList permissions={['usuario.view_all']} />}></Route>
            <Route path="/usuarios/form" element={<UsuarioForm permissions={['usuario.create']} />}></Route>
            <Route path="/usuarios/form/:pk" element={<UsuarioForm permissions={['usuario.update']} />}></Route>
        </Routes>
    )
}
