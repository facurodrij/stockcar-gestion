# Historias de Usuario para ERP

## TODO List de Historias de Usuario

- [ ] Módulo de Ventas
    - [ ] [Historia de Usuario 1.1](#historia-de-usuario-11)
    - [ ] [Historia de Usuario 1.2](#historia-de-usuario-12)
- [ ] Módulo de Compras
    - [ ] [Historia de Usuario 2.1](#historia-de-usuario-21)
    - [ ] [Historia de Usuario 2.2](#historia-de-usuario-22)
    - [ ] [Historia de Usuario 2.3](#historia-de-usuario-23)
    - [ ] [Historia de Usuario 2.4](#historia-de-usuario-24)
    - [ ] [Historia de Usuario 2.5](#historia-de-usuario-25)
- [ ] Módulo de Inventario
    - [ ] [Historia de Usuario 3.1](#historia-de-usuario-31)

## Módulo de Ventas

### Historia de Usuario 1.1

**Como** un vendedor,
**Quiero** registrar una nueva venta,
**Para que** pueda mantener un registro actualizado de todas las ventas.

**Criterios de Aceptación**

- El sistema debe permitir ingresar los detalles de la venta, incluyendo el producto, la cantidad y el precio.
- El sistema debe actualizar el inventario después de cada venta.
- El sistema debe generar un recibo de la venta.
- El sistema debe permitir filtrar el listado de ventas por todos los campos.

### Historia de Usuario 1.2

**Como** un gerente,
**Quiero** ver un dashboard al inicio del sistema,
**Para que** pueda tener una visión general del rendimiento de la empresa.

**Criterios de Aceptación**

- El sistema debe mostrar un resumen de las ventas con un rango de fechas.
- El sistema debe mostrar un resumen de las compras con un rango de fechas.
- El sistema debe mostrar un resumen de los productos más vendidos.

## Módulo de Compras

### Historia de Usuario 2.1

**Como** un gerente,
**Quiero** registrar una nueva compra,
**Para que** pueda mantener un registro actualizado de todas las compras y sus vencimientos.

**Criterios de Aceptación**

- El sistema debe permitir ingresar los detalles de la compra.
- El sistema debe permitir ingresar todos los vencimientos de la compra.
- El sistema debe actualizar el inventario después de cada compra.
- El sistema debe recibir los datos de la factura de la compra.
- El sistema debe permitir filtrar el listado de compras por todos los campos.

### Historia de Usuario 2.2

**Como** un gerente,
**Quiero** ver un listado de los vencimientos de compras,
**Para que** pueda gestionar los pagos de manera efectiva.

**Criterios de Aceptación**

- El Dashboard debe mostrar las compras que están por vencer y extender el listado si es necesario.
- El sistema debe enviar una alerta cuando una compra esté por vencer.
- El sistema debe permitir filtrar el listado de vencimientos por todos los campos.

### Historia de Usuario 2.3

**Como** un vendedor,
**Quiero** registrar una devolución de compra,
**Para que** pueda mantener un registro actualizado de todas las devoluciones.

**Criterios de Aceptación**

- El sistema debe permitir ingresar los detalles de la devolución.
- El sistema debe actualizar el inventario después de cada devolución.
- El sistema debe generar un recibo de la devolución.
- El sistema debe permitir filtrar el listado de devoluciones por todos los campos.

### Historia de Usuario 2.4

**Como** un vendedor,
**Quiero** obtener el precio de todos los catálogos de proveedores para un producto,
**Para que** al momento de efectuar una venta pueda seleccionar el proveedor con el mejor precio.

**Criterios de Aceptación**

- El sistema debe obtener de alguna forma los precios de los productos de los catálogos de al menos el 60% de los
  proveedores.
- El sistema debe mostrar el precio de cada proveedor al momento de buscar el producto.
- Si el producto no se encuentra en el catálogo de un proveedor, el sistema debe mostrar un mensaje indicando que el
  producto no se encuentra en el catálogo.
- (Opcional) Si el producto no se encuentra en el catálogo de un proveedor, el sistema debe mostrar el precio un
  producto similar (otra marca o modelo).

### Historia de Usuario 2.5

**Como** un gerente,
**Quiero** ver un listado de los cheques pendientes de cobro,
**Para que** pueda gestionar los pagos de manera efectiva.

**Criterios de Aceptación**

- El Dashboard debe mostrar los cheques que están por vencer y extender el listado si es necesario.
- El sistema debe enviar una alerta cuando un cheque esté por vencer.
- El sistema debe permitir filtrar el listado de cheques por todos los campos.
- El sistema debe permitir marcar un cheque como cobrado, vendido, anulado o rechazado.

## Módulo de Inventario

### Historia de Usuario 3.1

**Como** un gerente de inventario,
**Quiero** ver un informe de inventario,
**Para que** pueda gestionar el inventario de manera efectiva.

**Criterios de Aceptación**

- El sistema debe mostrar la cantidad actual de cada producto en el inventario.
- El sistema debe alertar cuando un producto esté por debajo del nivel mínimo de inventario.