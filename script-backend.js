// Global variables
let currentUser = null;
let authToken = null;
let studyMaterials = [];

// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const userDisplay = document.getElementById('userDisplay');
const menuItems = document.querySelectorAll('.menu-item');
const contentSections = document.querySelectorAll('.content-section');
const materialsGrid = document.getElementById('materialsGrid');
const uploadForm = document.getElementById('uploadForm');
const fileUploadArea = document.getElementById('fileUploadArea');
const fileUpload = document.getElementById('fileUpload');
const filePreview = document.getElementById('filePreview');
const totalMaterials = document.getElementById('totalMaterials');
const lastLogin = document.getElementById('lastLogin');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is already logged in
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }

    // Event listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Menu navigation
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.getAttribute('data-section');
            switchSection(section);
        });
    });

    // File upload functionality
    setupFileUpload();
    
    // Upload form submission
    uploadForm.addEventListener('submit', handleFileUpload);
    
    // Filter functionality
    setupFilters();
    
    // Load initial data if logged in
    if (currentUser) {
        loadStudyMaterials();
        updateStats();
    }
}

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
    };

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Login functionality
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        authToken = response.token;
        currentUser = response.user;
        
        // Save to localStorage
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showNotification('Login successful!', 'success');
        showDashboard();
    } catch (error) {
        showNotification(error.message || 'Login failed', 'error');
    }
}

// Logout functionality
function handleLogout() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showLogin();
    showNotification('Logged out successfully', 'info');
}

// Show dashboard
function showDashboard() {
    loginSection.classList.remove('active');
    dashboardSection.classList.add('active');
    userDisplay.textContent = `Welcome, ${currentUser.name}!`;
    loadStudyMaterials();
    updateStats();
}

// Show login
function showLogin() {
    dashboardSection.classList.remove('active');
    loginSection.classList.add('active');
    loginForm.reset();
}

// Switch between content sections
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
        if (section.id === `${sectionName}Section`) {
            section.classList.add('active');
        }
    });
}

// Load study materials from API
async function loadStudyMaterials(filteredMaterials = null) {
    try {
        if (filteredMaterials) {
            displayMaterials(filteredMaterials);
            return;
        }

        const materials = await apiRequest('/materials');
        studyMaterials = materials;
        displayMaterials(materials);
    } catch (error) {
        showNotification('Failed to load materials', 'error');
        displayMaterials([]);
    }
}

// Display materials in the grid
function displayMaterials(materials) {
    materialsGrid.innerHTML = '';
    
    if (materials.length === 0) {
        materialsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 15px; color: #ccc;"></i>
                <h3>No materials found</h3>
                <p>Try adjusting your filters or upload new materials.</p>
            </div>
        `;
        return;
    }
    
    materials.forEach(material => {
        const materialCard = createMaterialCard(material);
        materialsGrid.appendChild(materialCard);
    });
}

// Create material card
function createMaterialCard(material) {
    const card = document.createElement('div');
    card.className = 'material-card';
    
    const iconClass = getFileIcon(material.fileType);
    const iconColor = getFileColor(material.fileType);
    
    card.innerHTML = `
        <div class="material-header">
            <div class="material-icon" style="background: ${iconColor};">
                <i class="${iconClass}"></i>
            </div>
            <div class="material-info">
                <h3>${material.title}</h3>
                <p>${material.fileName}</p>
            </div>
        </div>
        <div class="material-details">
            <p><i class="fas fa-graduation-cap"></i> ${material.course}</p>
            <p><i class="fas fa-calendar"></i> Year ${material.year}, Semester ${material.semester}</p>
            <p><i class="fas fa-clock"></i> Uploaded: ${formatDate(material.uploadDate)}</p>
            <p><i class="fas fa-file"></i> Size: ${material.size}</p>
            ${material.description ? `<p><i class="fas fa-info-circle"></i> ${material.description}</p>` : ''}
        </div>
        <div class="material-actions">
            <button class="action-btn download-btn" onclick="downloadMaterial(${material.id})">
                <i class="fas fa-download"></i> Download
            </button>
            <button class="action-btn view-btn" onclick="viewMaterial(${material.id})">
                <i class="fas fa-eye"></i> View
            </button>
        </div>
    `;
    
    return card;
}

// Get file icon based on file type
function getFileIcon(fileType) {
    const icons = {
        'pdf': 'fas fa-file-pdf',
        'doc': 'fas fa-file-word',
        'docx': 'fas fa-file-word',
        'ppt': 'fas fa-file-powerpoint',
        'pptx': 'fas fa-file-powerpoint',
        'txt': 'fas fa-file-alt'
    };
    return icons[fileType] || 'fas fa-file';
}

// Get file color based on file type
function getFileColor(fileType) {
    const colors = {
        'pdf': '#dc3545',
        'doc': '#007bff',
        'docx': '#007bff',
        'ppt': '#fd7e14',
        'pptx': '#fd7e14',
        'txt': '#6c757d'
    };
    return colors[fileType] || '#6c757d';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Setup file upload functionality
function setupFileUpload() {
    // Drag and drop functionality
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#667eea';
        fileUploadArea.style.background = '#e9ecef';
    });
    
    fileUploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#667eea';
        fileUploadArea.style.background = '#f8f9fa';
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#667eea';
        fileUploadArea.style.background = '#f8f9fa';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileUpload.files = files;
            showFilePreview(files[0]);
        }
    });
    
    // File input change
    fileUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            showFilePreview(e.target.files[0]);
        }
    });
}

// Show file preview
function showFilePreview(file) {
    const fileType = file.name.split('.').pop().toLowerCase();
    const iconClass = getFileIcon(fileType);
    const iconColor = getFileColor(fileType);
    
    filePreview.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <div style="width: 40px; height: 40px; border-radius: 8px; background: ${iconColor}; display: flex; align-items: center; justify-content: center; color: white;">
                <i class="${iconClass}"></i>
            </div>
            <div>
                <strong>${file.name}</strong>
                <br>
                <small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>
            </div>
        </div>
    `;
    filePreview.classList.add('show');
}

// Handle file upload
async function handleFileUpload(e) {
    e.preventDefault();
    
    const courseName = document.getElementById('courseName').value;
    const year = document.getElementById('year').value;
    const semester = document.getElementById('semester').value;
    const description = document.getElementById('description').value;
    const file = fileUpload.files[0];
    
    if (!file) {
        showNotification('Please select a file to upload', 'error');
        return;
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseName', courseName);
    formData.append('year', year);
    formData.append('semester', semester);
    formData.append('description', description);
    
    // Show upload progress
    const uploadBtn = document.querySelector('.upload-btn');
    const originalText = uploadBtn.innerHTML;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    uploadBtn.disabled = true;
    
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

        const newMaterial = await response.json();
        
        // Reset form
        uploadForm.reset();
        filePreview.classList.remove('show');
        
        // Reload materials
        await loadStudyMaterials();
        updateStats();
        
        showNotification('File uploaded successfully!', 'success');
        
        // Switch to materials section
        switchSection('materials');
    } catch (error) {
        showNotification(error.message || 'Upload failed', 'error');
    } finally {
        // Reset button
        uploadBtn.innerHTML = originalText;
        uploadBtn.disabled = false;
    }
}

// Setup filters
function setupFilters() {
    const courseFilter = document.getElementById('courseFilter');
    const yearFilter = document.getElementById('yearFilter');
    const semesterFilter = document.getElementById('semesterFilter');
    
    [courseFilter, yearFilter, semesterFilter].forEach(filter => {
        filter.addEventListener('change', applyFilters);
    });
}

// Apply filters
async function applyFilters() {
    const courseFilter = document.getElementById('courseFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    const semesterFilter = document.getElementById('semesterFilter').value;
    
    try {
        let url = '/materials?';
        const params = new URLSearchParams();
        
        if (courseFilter) params.append('course', courseFilter);
        if (yearFilter) params.append('year', yearFilter);
        if (semesterFilter) params.append('semester', semesterFilter);
        
        const materials = await apiRequest(`/materials?${params.toString()}`);
        displayMaterials(materials);
    } catch (error) {
        showNotification('Failed to filter materials', 'error');
    }
}

// Update statistics
async function updateStats() {
    try {
        const profileData = await apiRequest('/profile');
        totalMaterials.textContent = profileData.stats.totalMaterials;
        lastLogin.textContent = new Date(profileData.stats.lastLogin).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Failed to update stats:', error);
    }
}

// Download material
async function downloadMaterial(materialId) {
    try {
        const response = await fetch(`${API_BASE_URL}/download/${materialId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Download failed');
        }

        // Create a blob from the response
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('content-disposition')?.split('filename=')[1] || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification('Download started successfully!', 'success');
    } catch (error) {
        showNotification('Download failed', 'error');
    }
}

// View material (opens in new tab)
function viewMaterial(materialId) {
    const material = studyMaterials.find(m => m.id === materialId);
    if (material) {
        // For PDF files, we can open them in a new tab
        if (material.fileType === 'pdf') {
            window.open(`${API_BASE_URL}/download/${materialId}`, '_blank');
        } else {
            showNotification('File preview not available for this file type', 'info');
        }
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
