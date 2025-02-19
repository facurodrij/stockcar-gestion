import React, { useEffect } from 'react';
import { Link } from "react-router-dom";
import { styled, useTheme } from '@mui/material/styles';
import { AppBar as MuiAppBar, Box, Divider, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Toolbar, Drawer as MuiDrawer, Button, Typography } from '@mui/material';
import { AccountCircle, Menu as MenuIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, People, Person, Settings, ReceiptLong, Inventory2, PointOfSale, Store, SwapHoriz, LocalShipping } from '@mui/icons-material';

const drawerWidth = 240;

const openedMixin = (theme) => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
});

const closedMixin = (theme) => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...(open && {
            ...openedMixin(theme),
            '& .MuiDrawer-paper': openedMixin(theme),
        }),
        ...(!open && {
            ...closedMixin(theme),
            '& .MuiDrawer-paper': closedMixin(theme),
        }),
    }),
);

const pagesList = [
    {
        title: 'Ventas',
        icon: <PointOfSale />,
        path: '/ventas',
        required_permissions: ['venta.view_all'],
    },
    {
        title: 'Ordenes de Venta',
        icon: <ReceiptLong />,
        path: '/ventas-orden',
        required_permissions: [],
    },
    {
        title: 'Articulos',
        icon: <Inventory2 />,
        path: '/articulos',
        required_permissions: ['articulo.view_all'],
    },
    {
        title: 'Movimientos de Stock',
        icon: <SwapHoriz />,
        path: '/movimientos-stock',
        required_permissions: ['movimiento_stock.view_all'],
    },
    {
        title: 'Clientes',
        icon: <People />,
        path: '/clientes',
        required_permissions: ['cliente.view_all'],
    },
    {
        title: 'Proveedores',
        icon: <LocalShipping />,
        path: '/proveedores',
        required_permissions: ['proveedor.view_all'],
    },
    {
        title: 'Usuarios',
        icon: <Person />,
        path: '/usuarios',
        required_permissions: ['usuario.view_all'],
    },
    {
        title: 'Comercios',
        icon: <Store />,
        path: '/comercios',
        required_permissions: ['comercio.view_all'],
    },
    {
        title: 'Configuración',
        icon: <Settings />,
        path: '/config',
        required_permissions: ['configuracion.view_all'],
    },
];

export default function Header() {
    const theme = useTheme();
    const [open, setOpen] = React.useState(false);
    const [auth, setAuth] = React.useState(false);
    const [user, setUser] = React.useState({});
    const [permissions, setPermissions] = React.useState([]);

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };

    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    }

    const handleClose = () => {
        setAnchorEl(null);
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        window.location.href = '/login';
    }

    useEffect(() => {
        const token = localStorage.getItem('token');
        const permissionsList = JSON.parse(localStorage.getItem('permissions'));
        const user = JSON.parse(localStorage.getItem('user'));
        if (token) {
            setAuth(true);
            setUser(user);
            setPermissions(permissionsList);
        } else {
            setAuth(false);
            setUser({});
            setPermissions([]);
        }
    }, []);

    return (
        <>
            <AppBar position="fixed" open={open}>
                <Toolbar>
                    {auth ? (
                        <>
                            <IconButton
                                color="inherit"
                                aria-label="open drawer"
                                onClick={handleDrawerOpen}
                                edge="start"
                                sx={{
                                    marginRight: 5,
                                    ...(open && { display: 'none' }),
                                }}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Box sx={{ flexGrow: 1 }} />
                            <Typography variant="h6" color="inherit" component="div">
                                {user.username}
                            </Typography>
                            <IconButton
                                aria-label="account of current user"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={handleMenu}
                                edge="end"
                                color="inherit"
                            >
                                <AccountCircle />
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                            >
                                <MenuItem component={Link} to="/profile" onClick={handleClose}>Mi Perfil</MenuItem>
                                <MenuItem onClick={handleClose}>My account</MenuItem>
                                <Divider />
                                <MenuItem onClick={handleLogout}>Cerrar Sesión</MenuItem>
                            </Menu>
                        </>
                    ) : (
                        <>
                            <Box sx={{ flexGrow: 1 }} />
                            <Button color="inherit" component={Link} to="/login">Iniciar sesión</Button>
                        </>
                    )}
                </Toolbar>
            </AppBar>
            {auth && (
                <Drawer variant="permanent" open={open}>
                    <DrawerHeader>
                        <IconButton onClick={handleDrawerClose}>
                            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                        </IconButton>
                    </DrawerHeader>
                    <Divider />
                    <List>
                        {pagesList.map((page, index) => (
                            page.required_permissions.length === 0 ||
                                page.required_permissions.some(permission => permissions.includes(permission)) ? (
                                <ListItem key={page.title} disablePadding sx={{ display: 'block' }}>
                                    <ListItemButton
                                        component={Link} to={page.path}
                                        sx={{
                                            minHeight: 48,
                                            justifyContent: open ? 'initial' : 'center',
                                            px: 2.5,
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 0,
                                                mr: open ? 3 : 'auto',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {page.icon}
                                        </ListItemIcon>
                                        <ListItemText primary={page.title} sx={{ opacity: open ? 1 : 0 }} />
                                    </ListItemButton>
                                </ListItem>
                            ) : null
                        ))}
                    </List>
                </Drawer>
            )}
        </>
    );
}
