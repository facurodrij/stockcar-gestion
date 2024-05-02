import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import CssBaseline from "@mui/material/CssBaseline";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import ThemeProvider from "@mui/material/styles/ThemeProvider";
import {theme} from "./theme";
import 'dayjs/locale/es';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <CssBaseline/>
        <ThemeProvider theme={theme}>
            <App/>
        </ThemeProvider>
    </React.StrictMode>
);
