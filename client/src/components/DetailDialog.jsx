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
import Box from "@mui/material/Box";
import {Grid, Paper, Tab, Tabs} from "@mui/material";
import {ReactNode} from "react";
import PropTypes from "prop-types";
import ListItem from "@mui/material/ListItem";
import {styled} from "@mui/material/styles";
import {API} from "../App";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} timeout={1000}>{props.children}</Slide>
});


function a11yProps(index) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}

export default function DetailDialog({model, item, open, onClose, context}) {
    const [itemData, setItemData] = useState(null);
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const fetchDetailData = async () => {
        const url = `${API}/${model}/${item.id}`
        const res = await fetch(url);
        const data = await res.json();
        // console.log(data[model]);
        setItemData(data[model]);
    }

    useEffect(() => {
        if (open) {
            fetchDetailData().then(() =>
                console.log('Data fetched', itemData),
            )
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
                            {context.title}
                        </Typography>
                        {/* Button for Edit */}
                        <Button
                            color="inherit"
                            onClick={() => console.log('Edit')}
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
                        aria-label="Vertical tabs example"
                        sx={{borderRight: 1, borderColor: 'divider', pt: 2}}
                    >
                        {context.tabsName.map((tab, index) => (
                            <Tab label={tab} {...a11yProps(index)} key={index}/>
                        ))}
                    </Tabs>
                    {context.tabsPanel.map((TabPanelComponent, index) => (
                        <React.Fragment key={index}>
                            {TabPanelComponent(itemData, value, index)}
                        </React.Fragment>
                    ))}
                </Box>
            </Dialog>
        </React.Fragment>
    );
}