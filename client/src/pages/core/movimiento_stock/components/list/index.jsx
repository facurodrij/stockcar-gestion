import React, { useEffect } from "react";
import dayjs from "dayjs";
import { API } from "../../../../../App";
import List from "../../../../../common/components/List";
import checkPermissions from "../../../../../config/auth/checkPermissions";
import PageTitle from "../../../../../common/components/PageTitle";


export default function MovimientoStockList({ permissions }) {
    const apiUrl = `${API}/movimientos-stock`;
    const editUrl = '/movimientos-stock/form';
    const detailUrl = "/movimientos-stock"
    const allowView = checkPermissions(["movimiento_stock.view"], false);
    const allowCreate = checkPermissions(["movimiento_stock.create"], false);
    const allowUpdate = false;
    const allowDelete = false;

    useEffect(() => {
        checkPermissions(permissions);
    }, [permissions]);

    const columns = [
        {
            field: 'fecha_hora', headerName: 'Fecha y hora', type: 'dateTime', flex: 2,
            valueFormatter: (value) => {
                if (!value) {
                    return "";
                }
                return dayjs(value, 'YYYY-MM-DDTHH:mm:ss').format('DD/MM/YYYY HH:mm:ss');
            }
        },
        { field: 'tipo_movimiento', headerName: 'Tipo de Movimiento', flex: 2 },
        { field: 'origen', headerName: 'Origen', flex: 2 }
    ];

    const mapDataToRows = (data) => {
        return data['movimientos'].map(item => ({
            id: item.id,
            fecha_hora: item.fecha_hora,
            tipo_movimiento: item.tipo_movimiento,
            origen: item.origen
        }));
    };

    const snackbarMessages = {
        fetchError: (error) => `Error al obtener los movimientos de stock: ${error}`,
        deleteSuccess: (message) => message,
        deleteError: (error) => `Error al eliminar el movimiento de stock: ${error}`,
        actionCancelled: 'Acción cancelada'
    };

    const toolbarProps = {
        show_btn_add: allowCreate,
        txt_btn_add: 'Nuevo Movimiento de Stock',
        url_btn_add: '/movimientos-stock/form'
    };

    return (
        <>
            <PageTitle heading="Movimientos de Stock" />
            <List
                apiUrl={apiUrl}
                editUrl={editUrl}
                detailUrl={detailUrl}
                allowView={allowView}
                allowCreate={allowCreate}
                allowUpdate={allowUpdate}
                allowDelete={allowDelete}
                columns={columns}
                mapDataToRows={mapDataToRows}
                snackbarMessages={snackbarMessages}
                toolbarProps={toolbarProps}
                initialSortField='fecha_hora'
                initialSortOrder='desc'
            />
        </>
    );
}
