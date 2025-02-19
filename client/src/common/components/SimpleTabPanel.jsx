import Box from "@mui/material/Box";
import React from "react";
import PropTypes from "prop-types";

export default function SimpleTabPanel(props) {
    const {children, value, index, ...other} = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
            style={{display: value === index ? "block" : "none"}}
            // Agrego style=... para mantener todos los campos en el DOM y
            // simplemente ocultar los que no están en la pestaña activa.
            // Ya que si no react-hook-form no puede validar los campos en las pestañas ocultas.
        >
            <Box sx={{p: 3}}>
                {children}
            </Box>
        </div>
    );
}

SimpleTabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};
