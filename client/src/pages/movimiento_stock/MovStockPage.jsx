import React, { useEffect } from "react";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import { checkAuth, checkPermissions } from "../../utils/checkAuth";
import List from '../../components/shared/List';
import { API } from '../../App';

export default function MovStockPage() {
    useEffect(() => {
        checkAuth();
        if (!checkPermissions(["movimiento_stock.view_all"])) {
            window.location.href = "/unauthorized";
        }
    }, []);

    const allowView = checkPermissions(["movimiento_stock.view"]);
    const allowCreate = checkPermissions(["movimiento_stock.create"]);
    const allowUpdate = false;
    const allowDelete = false;

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
            <Typography
                variant="h4"
                sx={{
                    mt: 2,
                    mb: 2,
                    fontFamily: "roboto",
                    color: "inherit",
                }}
            >
                Movimientos de Stock
            </Typography>
            <List
                apiUrl={`${API}/movimientos-stock`}
                editUrl="/movimientos-stock/form"
                detailUrl="/movimientos-stock"
                allowView={allowView}
                allowCreate={allowCreate}
                allowUpdate={allowUpdate}
                allowDelete={allowDelete}
                columns={columns}
                mapDataToRows={mapDataToRows}
                snackbarMessages={snackbarMessages}
                toolbarProps={toolbarProps}
                initialSortField = 'fecha_hora'
                initialSortOrder = 'desc'
            />
        </>
    );
}