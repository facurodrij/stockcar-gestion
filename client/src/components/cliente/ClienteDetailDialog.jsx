import React, {useEffect, useState} from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import Box from "@mui/material/Box";
import {Tab, Tabs} from "@mui/material";
import {API} from "../../App";
import GeneralTabPanel from "../../pages/cliente/detail/GeneralTabPanel";
import InvoiceTabPanel from "../../pages/cliente/detail/InvoiceTabPanel";
import {Link} from "react-router-dom";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} timeout={1000}>{props.children}</Slide>
});


function a11yProps(index) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}

export default function ClienteDetailDialog({item, open, onClose}) {
    const [itemData, setItemData] = useState(null);
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const fetchData = async () => {
        const res = await fetch(`${API}/clientes/${item.id}`);
        return await res.json();
    }

    useEffect(() => {
        if (open) {
            fetchData().then((data) => {
                setItemData(data['cliente']);
            });
        }
    }, [open]);

    const tabsName = ['General', 'Datos Facturación'];
    const tabsPanel = [
        (item, value, index) => <GeneralTabPanel item={item} value={value} index={index}/>,
        (item, value, index) => <InvoiceTabPanel item={item} value={value} index={index}/>
    ];

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
                            Detalle de Cliente
                        </Typography>
                        <Button
                            color="inherit"
                            component={Link}
                            to={`/clientes/form/${itemData?.id}`}
                        >
                            Editar
                        </Button>
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
                        sx={{borderRight: 1, borderColor: 'divider', pt: 2}}
                    >
                        {tabsName.map((tab, index) => (
                            <Tab label={tab} {...a11yProps(index)} key={index}/>
                        ))}
                    </Tabs>
                    {tabsPanel.map((TabPanelComponent, index) => (
                        <React.Fragment key={index}>
                            {TabPanelComponent(itemData, value, index)}
                        </React.Fragment>
                    ))}
                </Box>
            </Dialog>
        </React.Fragment>
    );
}