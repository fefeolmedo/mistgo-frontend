// API Configuration
// For development: Always use localhost:5001 if you're testing locally
// For production: Update the second URL to your Azure backend API when deployed
const API_BASE_URL = 'https://mistgo-api-app-30879.azurewebsites.net';

// When you deploy your backend to Azure, change to:
// const API_BASE_URL = window.location.hostname === 'localhost' 
//   ? 'http://localhost:5001/api' 
//   : 'https://your-azure-backend.azurewebsites.net/api';

// Token Management
const TOKEN_KEY = 'mistgo_token';
const USER_KEY = 'mistgo_user';

function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getUser() {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

function removeUser() {
  localStorage.removeItem(USER_KEY);
}

function isAuthenticated() {
  return !!getToken();
}

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    const contentType = response.headers.get('content-type');
    let data = null;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (response.ok) {
      data = await response.text();
    }
    
    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - redirect to login
        removeToken();
        removeUser();
        if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
          window.location.href = '/';
        }
      }
      throw new Error(data?.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Login: allow username OR email
async function login(identifier, password) {
  const response = await apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({ username: identifier, email: identifier, password }),
    skipAuth: true
  });
  if (response.token) {
    saveToken(response.token);
    saveUser({ username: identifier, email: identifier });
  }
  return response;
}

// Register: send username + email + password
async function register(username, email, password) {
  const response = await apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
    skipAuth: true
  });
  if (response.token) {
    saveToken(response.token);
    saveUser({ username, email });
  }
  return response;
}

function logout() {
  removeToken();
  removeUser();
  window.location.href = '/';
}

// Items API Functions
async function getItems() {
  return await apiRequest('/items');
}

async function getItem(id) {
  return await apiRequest(`/items/${id}`);
}

async function createItem(item) {
  return await apiRequest('/items', {
    method: 'POST',
    body: JSON.stringify(item)
  });
}

async function updateItem(id, item) {
  return await apiRequest(`/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item)
  });
}

async function deleteItem(id) {
  return await apiRequest(`/items/${id}`, {
    method: 'DELETE'
  });
}

// UI Helper Functions
function showAlert(message, type = 'error') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  
  const existingAlert = document.querySelector('.alert');
  if (existingAlert) {
    existingAlert.remove();
  }
  
  const container = document.querySelector('.container') || document.body;
  container.insertBefore(alertDiv, container.firstChild);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

function showSpinner() {
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  spinner.id = 'loading-spinner';
  document.body.appendChild(spinner);
}

function hideSpinner() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.remove();
  }
}

// Check authentication on page load
function checkAuth() {
  const publicPages = ['/', '/index.html', '/register.html'];
  const currentPath = window.location.pathname;
  
  if (!isAuthenticated() && !publicPages.includes(currentPath)) {
    window.location.href = '/';
  }
}