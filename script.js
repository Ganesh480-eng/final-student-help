// Global variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const homepageSection = document.getElementById('homepageSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');
const userDisplay = document.getElementById('userDisplay');
const menuItems = document.querySelectorAll('.menu-item');
const contentSections = document.querySelectorAll('.content-section');
const materialsGrid = document.getElementById('materialsGrid');
const publicMaterialsGrid = document.getElementById('publicMaterialsGrid');
const uploadForm = document.getElementById('uploadForm');
const fileUploadArea = document.getElementById('fileUploadArea');
const fileUpload = document.getElementById('fileUpload');
const filePreview = document.getElementById('filePreview');
const totalMaterials = document.getElementById('totalMaterials');
const lastLogin = document.getElementById('lastLogin');

// Navigation buttons
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const promptLoginBtn = document.getElementById('promptLoginBtn');
const closeLoginModal = document.getElementById('closeLoginModal');
const closeRegisterModal = document.getElementById('closeRegisterModal');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const showLoginBtn = document.getElementById('showLoginBtn');

// Filter elements
const courseFilter = document.getElementById('courseFilter');
const yearFilter = document.getElementById('yearFilter');
const semesterFilter = document.getElementById('semesterFilter');
const publicCourseFilter = document.getElementById('publicCourseFilter');
const publicYearFilter = document.getElementById('publicYearFilter');
const publicSemesterFilter = document.getElementById('publicSemesterFilter');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupFormBindings();
    restoreSession();
    loadPublicMaterials();
});

function restoreSession() {
    authToken = localStorage.getItem('authToken');
    if (!authToken) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showHomepage();
        return;
    }

    // try to validate token by fetching profile
    fetch(`${API_BASE_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(async res => {
        if (!res.ok) {
            // invalid token — clear session
            authToken = null;
            currentUser = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            showHomepage();
            return;
        }
        const profile = await res.json();
        currentUser = profile;
        localStorage.setItem('currentUser', JSON.stringify(profile));
        showDashboard();
        // load data for logged-in user
        loadUserMaterials();
        updateStats();
        loadPublicMaterials();
    })
    .catch(err => {
        console.error('Session restore failed:', err);
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        showHomepage();
    });
}

function initializeApp() {
    // Check if user is already logged in
    if (authToken) {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        showDashboard();
        loadUserMaterials();
        updateStats();
    } else {
        showHomepage();
    }
}

function setupEventListeners() {
    // Navigation
    loginBtn?.addEventListener('click', () => showModal(loginModal));
    registerBtn?.addEventListener('click', () => showModal(registerModal));
    promptLoginBtn?.addEventListener('click', () => showModal(loginModal));
    
    // Modal controls
    closeLoginModal?.addEventListener('click', () => hideModal(loginModal));
    closeRegisterModal?.addEventListener('click', () => hideModal(registerModal));
    showRegisterBtn?.addEventListener('click', () => {
        hideModal(loginModal);
        showModal(registerModal);
    });
    showLoginBtn?.addEventListener('click', () => {
        hideModal(registerModal);
        showModal(loginModal);
    });
    
    // Close modals when clicking outside
    loginModal?.addEventListener('click', (e) => {
        if (e.target === loginModal) hideModal(loginModal);
    });
    registerModal?.addEventListener('click', (e) => {
        if (e.target === registerModal) hideModal(registerModal);
    });
    
    // Forms
    loginForm?.addEventListener('submit', handleLogin);
    registerForm?.addEventListener('submit', handleRegister);
    logoutBtn?.addEventListener('click', handleLogout);
    uploadForm?.addEventListener('submit', handleFileUpload);
    
    // Menu navigation
    menuItems?.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.getAttribute('data-section');
            switchSection(section);
        });
    });

    // File upload
    fileUploadArea?.addEventListener('click', () => fileUpload.click());
    fileUpload?.addEventListener('change', handleFileSelect);
    fileUploadArea?.addEventListener('dragover', handleDragOver);
    fileUploadArea?.addEventListener('drop', handleDrop);
    
    // Filters
    courseFilter?.addEventListener('change', loadUserMaterials);
    yearFilter?.addEventListener('change', loadUserMaterials);
    semesterFilter?.addEventListener('change', loadUserMaterials);
    publicCourseFilter?.addEventListener('change', loadPublicMaterials);
    publicYearFilter?.addEventListener('change', loadPublicMaterials);
    publicSemesterFilter?.addEventListener('change', loadPublicMaterials);
}

// Modal functions
function showModal(modal) {
    modal.classList.add('active');
}

function hideModal(modal) {
    modal.classList.remove('active');
}

// Section management
function showHomepage() {
    homepageSection.classList.add('active');
    dashboardSection.classList.remove('active');
}

function showDashboard() {
    homepageSection.classList.remove('active');
    dashboardSection.classList.add('active');
}

function switchSection(sectionName) {
    // Update menu items
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionName) {
            item.classList.add('active');
        }
    });
    
    // Update content sections
    contentSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionName + 'Section') {
            section.classList.add('active');
        }
    });
}

// API helper function
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const data = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        authToken = data.token;
        currentUser = data.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        hideModal(loginModal);
        showDashboard();
        loadUserMaterials();
        updateStats();
        
        showNotification('Login successful!', 'success');
    } catch (error) {
        showNotification('Login failed. Please check your credentials.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = {
        username: document.getElementById('regUsername').value,
        password: document.getElementById('regPassword').value,
        name: document.getElementById('regName').value,
        studentId: document.getElementById('regStudentId').value,
        email: document.getElementById('regEmail').value,
        course: document.getElementById('regCourse').value,
        year: document.getElementById('regYear').value
    };
    
    try {
        await apiRequest('/register', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        hideModal(registerModal);
        showModal(loginModal);
        showNotification('Registration successful! Please login.', 'success');
    } catch (error) {
        showNotification('Registration failed. Please try again.', 'error');
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    showHomepage();
    showNotification('Logged out successfully', 'success');
}

// Material loading functions
async function loadPublicMaterials() {
    try {
        const res = await fetch(`${API_BASE_URL}/public/materials`);
        if (!res.ok) throw new Error('Failed to load public materials');
        const materials = await res.json();
        displayPublicMaterials(materials);
    } catch (err) {
        console.error(err);
        showNotification('Could not load public materials', 'error');
    }
}

async function loadUserMaterials() {
    try {
        const course = courseFilter?.value || '';
        const year = yearFilter?.value || '';
        const semester = semesterFilter?.value || '';
        
        const params = new URLSearchParams();
        if (course) params.append('course', course);
        if (year) params.append('year', year);
        if (semester) params.append('semester', semester);
        
        const materials = await apiRequest(`/materials?${params}`);
        displayMaterials(materials);
    } catch (error) {
        console.error('Error loading user materials:', error);
    }
}

function displayPublicMaterials(materials) {
    const grid = publicMaterialsGrid || materialsGrid; // Use public grid first
    if (!grid) return;

    grid.innerHTML = ''; // Clear previous content
    if (!materials || !materials.length) {
        grid.innerHTML = '<p>No materials have been uploaded yet.</p>';
        return;
    }

    materials.forEach(m => {
        const card = document.createElement('div');
        card.className = 'material-card';
        // Ensure data-id and data-filename are present on the button
        card.innerHTML = `
            <div class="material-icon">${m.filetype || 'file'}</div>
            <h3>${m.title || 'Untitled'}</h3>
            <p>Course: ${m.course || 'N/A'}</p>
            <p>Year: ${m.year || 'N/A'}, Sem: ${m.semester || 'N/A'}</p>
            <p>Size: ${m.size || 'Unknown'}</p>
            <div class="material-actions">
                <button class="download-btn" data-id="${m.id}" data-filename="${m.filename || m.title || 'download'}">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        `;
        grid.appendChild(card);
    });

    // After rendering all cards, attach the click handlers
    attachPublicDownloadHandlers(grid);
}

function displayMaterials(materials) {
    if (!materialsGrid) return;
    
    if (materials.length === 0) {
        materialsGrid.innerHTML = '<div class="no-materials">No materials found</div>';
        return;
    }
    
    materialsGrid.innerHTML = materials.map(material => `
        <div class="material-card">
            <div class="material-icon">
                <i class="fas fa-file-${getFileIcon(material.fileType)}"></i>
            </div>
            <div class="material-info">
                <h3>${material.title}</h3>
                <p class="material-meta">
                    <span><i class="fas fa-graduation-cap"></i> ${material.course}</span>
                    <span><i class="fas fa-calendar"></i> ${material.year} - Semester ${material.semester}</span>
                </p>
                <p class="material-description">${material.description || 'No description available'}</p>
                <div class="material-footer">
                    <span class="file-size"><i class="fas fa-weight-hanging"></i> ${material.size}</span>
                    <span class="upload-date"><i class="fas fa-clock"></i> ${formatDate(material.uploadDate)}</span>
                </div>
            </div>
            <div class="material-actions">
                <button class="action-btn download-btn" onclick="downloadMaterial(${material.id})">
                    <i class="fas fa-download"></i>
                    Download
                </button>
            </div>
        </div>
    `).join('');
}

// File upload functions
async function handleFileUpload(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const file = fileUpload.files[0];
    
    if (!file) {
        showNotification('Please select a file', 'error');
        return;
    }
    
    formData.append('file', file);
    formData.append('courseName', document.getElementById('courseName').value);
    formData.append('year', document.getElementById('year').value);
    formData.append('semester', document.getElementById('semester').value);
    formData.append('description', document.getElementById('description').value);
    
    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }
        
        const result = await response.json();
        showNotification('File uploaded successfully!', 'success');
        
        // Reset form
        uploadForm.reset();
        filePreview.innerHTML = '';
        
        // Reload materials
        loadUserMaterials();
        loadPublicMaterials(); // Also reload public materials
        updateStats();
    } catch (error) {
        showNotification('Upload failed: ' + error.message, 'error');
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        displayFilePreview(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    fileUploadArea.classList.add('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        fileUpload.files = files;
        displayFilePreview(files[0]);
    }
}

function displayFilePreview(file) {
    filePreview.innerHTML = `
        <div class="file-preview-item">
            <i class="fas fa-file-${getFileIcon(file.name.split('.').pop())}"></i>
            <span>${file.name}</span>
            <span class="file-size">(${(file.size / 1024 / 1024).toFixed(1)} MB)</span>
        </div>
    `;
}

// Robust download helper: tries direct anchor (browser handles Content-Disposition) and falls back to fetch+blob.
// Works for public downloads (no auth) and authenticated downloads (when authToken present).
async function downloadMaterial(id, fallbackName = 'file') {
    if (!id) { showNotification('Invalid file id', 'error'); return; }

    // API_BASE_URL is "http://localhost:3000/api"
    const publicEndpoint = API_BASE_URL.replace(/\/api$/, '') + `/api/public/download/${id}`;
    const authEndpoint = `${API_BASE_URL}/download/${id}`;
    const endpoint = authToken ? authEndpoint : publicEndpoint;

    // 1) Try simple anchor click (lets browser save file using Content-Disposition)
    try {
        const a = document.createElement('a');
        a.href = endpoint;
        a.target = '_self';
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
    } catch (err) {
        console.warn('Anchor download failed, falling back to fetch:', err);
    }

    // 2) Fallback: fetch blob and trigger client download
    try {
        const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
        const res = await fetch(endpoint, { headers });
        if (!res.ok) {
            const json = await res.json().catch(()=>null);
            showNotification(json?.error || 'Download failed', 'error');
            return;
        }

        const blob = await res.blob();
        let filename = fallbackName;
        const cd = res.headers.get('content-disposition');
        if (cd) {
            const m = cd.match(/filename\*?=(?:UTF-8'')?"?([^";\r\n]+)"?/);
            if (m && m[1]) filename = decodeURIComponent(m[1]);
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('downloadMaterial error', err);
        showNotification('Download error', 'error');
    }
}

// Attach click listeners to all download buttons (call this after rendering materials)
function attachPublicDownloadHandlers(root = document) {
    const buttons = root.querySelectorAll('.download-btn[data-id]');
    buttons.forEach(btn => {
        // Avoid attaching multiple listeners to the same button
        if (btn.dataset._downloadBound) return;
        btn.dataset._downloadBound = '1';

        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const name = btn.dataset.filename || 'file';
            downloadMaterial(id, name); // This calls the download function from the previous step
        });
    });
}

// Called when app initializes or after login/register
async function loadProfile() {
    if (!authToken) return;
    try {
        const res = await fetch(`${API_BASE_URL}/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const profile = await res.json();
        currentUser = profile;
        localStorage.setItem('currentUser', JSON.stringify(profile));
        // Render profileSection content (simple inline render)
        const profileSection = document.getElementById('profileSection');
        if (profileSection) {
            profileSection.innerHTML = `
                <h2>My Profile</h2>
                <p><strong>Name:</strong> ${profile.name}</p>
                <p><strong>Username:</strong> ${profile.username || ''}</p>
                <p><strong>Email:</strong> ${profile.email}</p>
                <p><strong>Course:</strong> ${profile.course}</p>
                <p><strong>Year:</strong> ${profile.year}</p>
                <p><strong>Student ID:</strong> ${profile.studentId}</p>
            `;
        }
        if (userDisplay) userDisplay.textContent = `Welcome, ${profile.name}`;
    } catch (err) {
        console.error(err);
    }
}

// Initialize binding for forms (add to existing initialization sequence)
function setupFormBindings() {
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (uploadForm) uploadForm.addEventListener('submit', handleFileUpload);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
}

// ensure initialization calls
document.addEventListener('DOMContentLoaded', () => {
    // existing initializeApp logic should call these; if not call here:
    setupFormBindings();
    if (authToken) {
        try { currentUser = JSON.parse(localStorage.getItem('currentUser')); } catch(e){}
        loadProfile();
        loadUserMaterials?.();
        loadPublicMaterials();
        showDashboard();
    } else {
        showHomepage();
        loadPublicMaterials();
    }
});
