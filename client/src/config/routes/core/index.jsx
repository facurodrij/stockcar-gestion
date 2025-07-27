import React from "react";
import { Route, Routes } from "react-router-dom";
import ArticuloList from "../../../pages/core/articulo/components/list";
import ArticuloDetail from "../../../pages/core/articulo/components/detail";
import ArticuloForm from "../../../pages/core/articulo/components/form";
import ClienteList from "../../../pages/core/cliente/components/list";
// Cliente detail
import ClienteForm from "../../../pages/core/cliente/components/form";
import ComercioList from "../../../pages/core/comercio/components/list";
// Comercio detail
import ComercioForm from "../../../pages/core/comercio/components/form";
import MovimientoStockList from "../../../pages/core/movimiento_stock/components/list";
import MovimientoStockDetail from "../../../pages/core/movimiento_stock/components/detail";
import MovimientoStockForm from "../../../pages/core/movimiento_stock/components/form";
import VentaList from "../../../pages/core/venta/components/list";
import VentaDetail from "../../../pages/core/venta/components/detail";
import VentaForm from "../../../pages/core/venta/components/form";
import VentaOrdenList from "../../../pages/core/venta/components/orden/list";
import VentaOrdenForm from "../../../pages/core/venta/components/orden/form";
import VentaReporteVendedor from "../../../pages/core/venta_reports/components/por_vendedor";


export default function CoreRoutes() {
    return (
        <Routes>
            <Route path="/articulos" element={<ArticuloList permissions={['articulo.view_all']} />}></Route>
            <Route path="/articulos/:pk" element={<ArticuloDetail permissions={['articulo.view']} />}></Route>
            <Route path="/articulos/form" element={<ArticuloForm permissions={['articulo.create']} />}></Route>
            <Route path="/articulos/form/:pk" element={<ArticuloForm permissions={['articulo.update']} />}></Route>
            <Route path="/clientes" element={<ClienteList permissions={['cliente.view_all']} />}></Route>
            <Route path="/clientes/form" element={<ClienteForm permissions={['cliente.create']} />}></Route>
            <Route path="/clientes/form/:pk" element={<ClienteForm permissions={['cliente.update']} />}></Route>
            <Route path="/comercios" element={<ComercioList permissions={['comercio.view_all']} />}></Route>
            <Route path="/comercios/form" element={<ComercioForm permissions={['comercio.create']} />}></Route>
            <Route path="/comercios/form/:pk" element={<ComercioForm permissions={['comercio.update']} />}></Route>
            <Route path="/movimientos-stock" element={<MovimientoStockList permissions={['movimiento_stock.view_all']} />}></Route>
            <Route path="/movimientos-stock/:pk" element={<MovimientoStockDetail permissions={['movimiento_stock.view']} />}></Route>
            <Route path="/movimientos-stock/form" element={<MovimientoStockForm permissions={['movimiento_stock.create']} />}></Route>
            <Route path="/movimientos-stock/form/:pk" element={<MovimientoStockForm permissions={['movimiento_stock.update']} />}></Route>
            <Route path="/ventas" element={<VentaList permissions={['venta.view_all']} onlyOrders={false} />}></Route>
            <Route path="/ventas/:pk" element={<VentaDetail permissions={['venta.view']} />}></Route>
            <Route path="/ventas/form" element={<VentaForm permissions={['venta.create']} />}></Route>
            <Route path="/ventas/form/:pk" element={<VentaForm permissions={['venta.update']} />}></Route>
            <Route path="/ventas-orden" element={<VentaOrdenList />}></Route>
            <Route path="/ventas-orden/form" element={<VentaOrdenForm />}></Route>
            <Route path="/ventas-orden/form/:pk" element={<VentaOrdenForm />}></Route>
            <Route path="/ventas/reporte-ventas/por-vendedor" element={<VentaReporteVendedor permissions={['venta.view_all']} />}></Route>
        </Routes>
    )
}
