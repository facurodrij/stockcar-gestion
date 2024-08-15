const fetchWithAuth = async (url, method = 'GET', body = null) => {
    const token = localStorage.getItem('token');
    console.log('method', method);
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    const config = {
        method,
        headers
    };
    if (body) {
        config.body = JSON.stringify(body);
    }
    const response = await fetch(url, config);
    if (response.status === 401) {
        //localStorage.removeItem('token');
        window.location.href = '/unauthorized';
    }
    return response;
}

export default fetchWithAuth;