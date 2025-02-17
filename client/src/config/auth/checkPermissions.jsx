import checkAuth from "./checkAuth";

const checkPermissions = (permissions, redirect = true) => {
    if (checkAuth()) {
        const permissionsList = JSON.parse(localStorage.getItem('permissions'));
        if (!permissionsList || (!permissionsList.some(permission => permissions.includes(permission)))) {
            if (redirect) {
                window.location.href = '/unauthorized';
            }
            return false;
        }
        return true;
    }
    return false;
};

export default checkPermissions;