import React, { useEffect } from 'react';
import { Link } from "react-router-dom";
import { styled, useTheme } from '@mui/material/styles';
import { AppBar as MuiAppBar, Box, Divider, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Toolbar, Drawer as MuiDrawer, Button } from '@mui/material';
import { AccountCircle, Inbox as InboxIcon, Mail as MailIcon, Menu as MenuIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, People, Person, Settings, LocalShipping, Inventory2, PointOfSale, Store } from '@mui/icons-material';

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
        roles_required: ['admin', 'cobranza'],
    },
    {
        title: 'Ordenes de Venta',
        icon: <PointOfSale />,
        path: '/ventas-orden',
        roles_required: [],
    },
    {
        title: 'Articulos',
        icon: <Inventory2 />,
        path: '/articulos',
        roles_required: ['admin'],
    },
    {
        title: 'Clientes',
        icon: <People />,
        path: '/clientes',
        roles_required: ['admin', 'cobranza'],
    },
    {
        title: 'Usuarios',
        icon: <Person />,
        path: '/usuarios',
        roles_required: ['admin'],
    },
    {
        title: 'Comercios',
        icon: <Store />,
        path: '/comercios',
        roles_required: ['admin'],
    },
    {
        title: 'Configuración',
        icon: <Settings />,
        path: '/config',
        roles_required: ['admin'],
    },
];

export default function Header() {
    const theme = useTheme();
    const [open, setOpen] = React.useState(false);
    const [auth, setAuth] = React.useState(false);
    const [roles, setRoles] = React.useState([]);
    const [is_superuser, setIsSuperuser] = React.useState(false);

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
        localStorage.removeItem('roles');
        localStorage.removeItem('is_superuser');
        window.location.href = '/login';
    }

    useEffect(() => {
        const token = localStorage.getItem('token');
        const roleList = JSON.parse(localStorage.getItem('roles'));
        const is_superuser = localStorage.getItem('is_superuser');
        if (token && roleList) {
            setAuth(true);
            setRoles(roleList);
            if (is_superuser === 'true') {
                setIsSuperuser(true);
            }
        } else {
            setAuth(false);
            setRoles([]);
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
                            is_superuser ||
                                page.roles_required.length === 0 || page.roles_required.some(role => roles.includes(role)) ? (
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