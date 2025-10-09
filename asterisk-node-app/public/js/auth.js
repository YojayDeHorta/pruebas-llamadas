// public/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
  // Referencias a elementos del DOM
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegisterBtn = document.getElementById('show-register');
  const showLoginBtn = document.getElementById('show-login');
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');

  // Mostrar/ocultar formularios
  showRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  });

  showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
  });

  // Iniciar sesión
  loginBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
      alert('Por favor, complete todos los campos');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/dashboard.html';
    } catch (error) {
      alert(error.message || 'Error al iniciar sesión');
    }
  });

  // Registrarse
  registerBtn.addEventListener('click', async () => {
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;

    if (!username || !password) {
      alert('Por favor, complete todos los campos');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Error al registrarse');
      }

      const data = await response.json();
      alert(`Registro exitoso. Su extensión es: ${data.extension}`);
      registerForm.style.display = 'none';
      loginForm.style.display = 'block';
    } catch (error) {
      alert(error.message || 'Error al registrarse');
    }
  });

  // Verificar si el usuario ya está autenticado
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = '/dashboard.html';
  }
});