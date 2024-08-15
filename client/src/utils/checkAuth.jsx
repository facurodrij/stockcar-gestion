export const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        const redirect_to = window.location.pathname;
        window.location.href = '/login?redirect_to=' + redirect_to;
    }
};
