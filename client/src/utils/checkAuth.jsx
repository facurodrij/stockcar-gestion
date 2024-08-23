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
    const is_superuser = localStorage.getItem('is_superuser');
    if (is_superuser === 'true') {
        return true;
    }
    if (!rolesList || !rolesList.some(role => roles.includes(role))) {
        window.location.href = '/unauthorized';
    }
    return true;
}
