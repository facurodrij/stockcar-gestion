export const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        const redirect_to = window.location.pathname;
        window.location.href = '/login?redirect_to=' + redirect_to;
    }
    return true;
};

export const checkRoles = (roles) => {
    const rolesList = JSON.parse(localStorage.getItem('roles'));
    if (!rolesList || !rolesList.some(role => roles.includes(role))) {
        window.location.href = '/unauthorized';
    }
    return true;
}


export const checkPermissions = (permissions) => {
    const permissionsList = JSON.parse(localStorage.getItem('permissions'));
    if (!permissionsList || !permissionsList.some(permission => permissions.includes(permission))) {
        return false;
    }
    return true;
}