// public/js/app.js
document.addEventListener('DOMContentLoaded', () => {
  // Verificar si el usuario está autenticado
  const token = localStorage.getItem('token');
  if (!token && window.location.pathname.includes('dashboard')) {
    window.location.href = '/login.html';
    return;
  }

  // Redirigir a dashboard si está en login pero ya autenticado
  if (token && window.location.pathname.includes('login')) {
    window.location.href = '/dashboard.html';
    return;
  }
});