import React from "react";
import { Route, Routes } from "react-router-dom";
import ArticuloList from "../../../pages/core/articulo/components/list";
import ArticuloDetail from "../../../pages/core/articulo/components/detail";
import ArticuloForm from "../../../pages/core/articulo/components/form";

export default function CoreRoutes() {
    return (
        <Routes>
            <Route path="/articulos" element={<ArticuloList permissions={['articulo.view_all']} />}></Route>
            <Route path="/articulos/:pk" element={<ArticuloDetail permissions={['articulo.view']} />}></Route>
            <Route path="/articulos/form" element={<ArticuloForm permissions={['articulo.create']} />}></Route>
            <Route path="/articulos/form/:pk" element={<ArticuloForm permissions={['articulo.update']} />}></Route>
        </Routes>
    )
}
