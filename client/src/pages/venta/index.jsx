import React, {useState} from 'react'
import Typography from '@mui/material/Typography';
import {GridActionsCellItem} from '@mui/x-data-grid';
import {GridRowParams} from "@mui/x-data-grid";
import VisibilityIcon from '@mui/icons-material/Visibility';
import dayjs from "dayjs";
import {currencyFormatter} from "../../utils/formatters";
import GeneralTabPanel from "./detail/GeneralTabPanel";
import InvoiceTabPanel from "./detail/InvoiceTabPanel";
import List from "../../components/List";
import DetailDialog from "../../components/DetailDialog";


export default function Index() {
    const [itemSelected, setItemSelected] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    const handleShowDetail = (item) => {
        setItemSelected(item);
        setShowDetail(true); // Abre el DetailDialog
    }

    const handleCloseDetail = () => {
        setItemSelected(null);
        setShowDetail(false); // Cierra el DetailDialog
    }

    const listContext = {
        showDatePickers: true,
        autoLoad: false,
        columns: [
            {field: 'id', headerName: 'ID', width: 100},
            {
                field: 'fecha', headerName: 'Fecha', type: 'dateTime', width: 150,
                valueGetter: (value) => value && new Date(value),
                valueFormatter: (value) => dayjs(value).format('DD/MM/YYYY HH:mm')
            },
            {field: 'tipo_doc', headerName: 'Tipo', width: 50},
            {field: 'letra', headerName: 'Letra', width: 50},
            {field: 'nro_doc', headerName: 'Número', width: 150},
            {field: 'cliente', headerName: 'Cliente', width: 200},
            {
                field: 'gravado', headerName: 'Gravado',
                valueFormatter: (value) => currencyFormatter.format(value)
            },
            {
                field: 'total', headerName: 'Total',
                valueFormatter: (value) => currencyFormatter.format(value)
            },
            {
                field: 'actions', type: 'actions', headerName: 'Acciones', width: 100,
                getActions: (params: GridRowParams) => [
                    <GridActionsCellItem
                        icon={<VisibilityIcon/>}
                        label="Detalle"
                        onClick={() => handleShowDetail(params.row)}
                        showInMenu
                    />,
                    <GridActionsCellItem
                        icon={<VisibilityIcon/>}
                        label="Otra..."
                        onClick={() => console.log(params.row)}
                        showInMenu
                    />
                ]
            }
        ]
    };

    const detailContext = {
        title: 'Detalle de Venta',
        tabsName: ['General', 'Items Facturados'],
        tabsPanel: [
            (item, value, index) => <GeneralTabPanel item={item} value={value} index={index}/>,
            (item, value, index) => <InvoiceTabPanel item={item} value={value} index={index}/>
        ]
    }

    return (
        <>
            <Typography
                variant="h4"
                sx={{
                    mt: 2,
                    fontFamily: 'roboto',
                    color: 'inherit'
                }}
            >
                Ventas
            </Typography>
            <List model={"ventas"} context={listContext}/>
            <DetailDialog model={"ventas"} itemSelected={itemSelected} open={showDetail} onClose={handleCloseDetail}
                          context={detailContext}/>
        </>
    )
}