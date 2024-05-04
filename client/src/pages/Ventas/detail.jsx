import React, {useEffect, useState} from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import {API} from "./index";
import Box from "@mui/material/Box";
import {Grid, Paper, Tab, Tabs} from "@mui/material";
import {ReactNode} from "react";
import PropTypes from "prop-types";
import ListItem from "@mui/material/ListItem";
import {styled} from "@mui/material/styles";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} timeout={1000}>{props.children}</Slide>
});

function TabPanel(props) {
    const {children, value, index, ...other} = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{p: 3}}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}

export default function SaleDetailDialog({sale, open, onClose}) {
    const [itemsList, setItemsList] = useState(null);
    const [saleData, setSaleData] = useState(null);
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const getSaleData = async () => {
        const url = `${API}//ventas/${sale.id}`

        const res = await fetch(url);
        const data = await res.json();
        setSaleData(data.venta);
        setItemsList(data.items);
    }

    useEffect(() => {
        if (open) {
            getSaleData();
        }
    }, [open]);

    return (
        <React.Fragment>
            <Dialog
                fullScreen
                open={open}
                onClose={onClose}
                TransitionComponent={Transition}
            >
                <AppBar sx={{position: 'relative'}}>
                    <Toolbar>
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={onClose}
                            aria-label="close"
                        >
                            <CloseIcon/>
                        </IconButton>
                        <Typography sx={{ml: 2, flex: 1}} variant="h6" component="div">
                            Detalle de Venta
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Box
                    sx={{flexGrow: 1, bgcolor: 'background.paper', display: 'flex', height: 224}}
                >
                    <Tabs
                        orientation="vertical"
                        variant="scrollable"
                        value={value}
                        onChange={handleChange}
                        aria-label="Vertical tabs example"
                        sx={{borderRight: 1, borderColor: 'divider', pt: 2}}
                    >
                        <Tab label="General" {...a11yProps(0)} />
                        <Tab label="Items Facturados" {...a11yProps(1)} />
                        <Tab label="Item Three" {...a11yProps(2)} />
                        <Tab label="Item Four" {...a11yProps(3)} />
                        <Tab label="Item Five" {...a11yProps(4)} />
                        <Tab label="Item Six" {...a11yProps(5)} />
                        <Tab label="Item Seven" {...a11yProps(6)} />
                    </Tabs>
                    <TabPanel value={value} index={0} style={{width: '100%'}}>
                        <Typography variant="h3">General</Typography>
                        {/*<Box sx={{mt: 2}}>*/}
                        <Grid container spacing={2} sx={{p: 2}}>
                            <Grid item xs={12} md={6}>
                                <Typography variant={"h6"}>Fecha y Hora</Typography>
                                {saleData && saleData.fecha}
                                {/*Es necesario esta comprobacion debido a que el elemento se intenta mostrarse en
                                    el index, y por supuesto es indefined*/}
                                <Typography variant={"h6"} mt={2}>Tipo de Documento</Typography>
                                {saleData && saleData.tipo_doc}
                                <Typography variant={"h6"} mt={2}>Sucursal</Typography>
                                {saleData && saleData.sucursal}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant={"h6"}>Cliente</Typography>
                                {saleData && saleData.nombre_cliente}
                                <Typography variant={"h6"} mt={2}>Letra</Typography>
                                {saleData && saleData.letra}
                                <Typography variant={"h6"} mt={2}>Número</Typography>
                                {saleData && saleData.numero}
                            </Grid>
                        </Grid>
                        {/*</Box>*/}
                        <Divider sx={{my: 2}}/>
                        <Grid container spacing={2} sx={{p: 2}}>
                            <Grid item xs={12} md={6}>
                                <Typography variant={"h6"}>Vendedor</Typography>
                                {saleData && saleData.vendedor}
                                {/*Es necesario esta comprobacion debido a que el elemento se intenta mostrarse en
                                    el index, y por supuesto es indefined*/}
                                <Typography variant={"h6"} mt={2}>Operador</Typography>
                                {saleData && saleData.operador}
                                <Typography variant={"h6"} mt={2}>Asociado</Typography>
                                {saleData && saleData.asociado}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant={"h6"} mt={2}>Mov. Contable</Typography>
                                {saleData && saleData.movimiento}
                                <Typography variant={"h6"} mt={2}>TOTAL</Typography>
                                {saleData && saleData.total}
                            </Grid>
                        </Grid>
                    </TabPanel>
                    <TabPanel value={value} index={1} style={{width: '100%'}}>
                        Item facturados
                    </TabPanel>
                    <TabPanel value={value} index={2} style={{width: '100%'}}>
                        Item Three
                    </TabPanel>
                    <TabPanel value={value} index={3} style={{width: '100%'}}>
                        Item Four
                    </TabPanel>
                    <TabPanel value={value} index={4} style={{width: '100%'}}>
                        Item Five
                    </TabPanel>
                    <TabPanel value={value} index={5} style={{width: '100%'}}>
                        Item Six
                    </TabPanel>
                    <TabPanel value={value} index={6} style={{width: '100%'}}>
                        Item Seven
                    </TabPanel>
                </Box>
            </Dialog>
        </React.Fragment>
    );
}