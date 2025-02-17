const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login?redirect_to=' + window.location.pathname;
        return false;
    }
    return true;
};

export default checkAuth;