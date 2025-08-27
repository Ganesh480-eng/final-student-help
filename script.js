// Global variables
let currentUser = null;
let studyMaterials = [
    {
        id: 1,
        title: "Introduction to Computer Science",
        course: "Computer Science",
        year: "2024",
        semester: "1",
        fileType: "pdf",
        fileName: "intro_cs_2024.pdf",
        description: "Basic concepts and fundamentals of computer science",
        uploadDate: "2024-01-15",
        size: "2.5 MB"
    },
    {
        id: 2,
        title: "Advanced Mathematics Notes",
        course: "Mathematics",
        year: "2024",
        semester: "1",
        fileType: "docx",
        fileName: "advanced_math_notes.docx",
        description: "Comprehensive notes on calculus and linear algebra",
        uploadDate: "2024-01-20",
        size: "1.8 MB"
    },
    {
        id: 3,
        title: "Physics Lab Manual",
        course: "Physics",
        year: "2023",
        semester: "2",
        fileType: "pdf",
        fileName: "physics_lab_manual.pdf",
        description: "Laboratory experiments and procedures",
        uploadDate: "2023-12-10",
        size: "3.2 MB"
    },
    {
        id: 4,
        title: "Chemistry Formulas",
        course: "Chemistry",
        year: "2023",
        semester: "2",
        fileType: "ppt",
        fileName: "chemistry_formulas.pptx",
        description: "Important chemical formulas and reactions",
        uploadDate: "2023-12-05",
        size: "4.1 MB"
    },
    {
        id: 5,
        title: "Data Structures and Algorithms",
        course: "Computer Science",
        year: "2024",
        semester: "2",
        fileType: "pdf",
        fileName: "data_structures_algorithms.pdf",
        description: "Complete guide to data structures and algorithms",
        uploadDate: "2024-02-01",
        size: "5.7 MB"
    },
    {
        id: 6,
        title: "Organic Chemistry Notes",
        course: "Chemistry",
        year: "2024",
        semester: "1",
        fileType: "docx",
        fileName: "organic_chemistry_notes.docx",
        description: "Detailed notes on organic chemistry concepts",
        uploadDate: "2024-01-25",
        size: "2.9 MB"
    }
];

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
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
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
    
    // Load initial data
    loadStudyMaterials();
    updateStats();
}

// Login functionality
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Demo authentication (in real app, this would be server-side)
    if (username === 'student123' && password === 'password123') {
        currentUser = {
            username: username,
            name: 'John Doe',
            studentId: 'STU2024001',
            email: 'john.doe@university.edu',
            course: 'Computer Science',
            year: '2024'
        };
        
        // Save user to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showNotification('Login successful!', 'success');
        showDashboard();
    } else {
        showNotification('Invalid credentials. Please try again.', 'error');
    }
}

// Logout functionality
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showLogin();
    showNotification('Logged out successfully', 'info');
}

// Show dashboard
function showDashboard() {
    loginSection.classList.remove('active');
    dashboardSection.classList.add('active');
    userDisplay.textContent = `Welcome, ${currentUser.name}!`;
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

// Load study materials
function loadStudyMaterials(filteredMaterials = null) {
    const materials = filteredMaterials || studyMaterials;
    
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
function handleFileUpload(e) {
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
    
    // Simulate upload process
    const uploadBtn = document.querySelector('.upload-btn');
    const originalText = uploadBtn.innerHTML;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    uploadBtn.disabled = true;
    
    setTimeout(() => {
        // Create new material
        const newMaterial = {
            id: studyMaterials.length + 1,
            title: file.name.replace(/\.[^/.]+$/, ""),
            course: courseName,
            year: year,
            semester: semester,
            fileType: file.name.split('.').pop().toLowerCase(),
            fileName: file.name,
            description: description,
            uploadDate: new Date().toISOString().split('T')[0],
            size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
        };
        
        studyMaterials.unshift(newMaterial);
        
        // Reset form
        uploadForm.reset();
        filePreview.classList.remove('show');
        
        // Update display
        loadStudyMaterials();
        updateStats();
        
        // Reset button
        uploadBtn.innerHTML = originalText;
        uploadBtn.disabled = false;
        
        showNotification('File uploaded successfully!', 'success');
        
        // Switch to materials section
        switchSection('materials');
    }, 2000);
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
function applyFilters() {
    const courseFilter = document.getElementById('courseFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    const semesterFilter = document.getElementById('semesterFilter').value;
    
    let filteredMaterials = studyMaterials;
    
    if (courseFilter) {
        filteredMaterials = filteredMaterials.filter(material => material.course === courseFilter);
    }
    
    if (yearFilter) {
        filteredMaterials = filteredMaterials.filter(material => material.year === yearFilter);
    }
    
    if (semesterFilter) {
        filteredMaterials = filteredMaterials.filter(material => material.semester === semesterFilter);
    }
    
    loadStudyMaterials(filteredMaterials);
}

// Update statistics
function updateStats() {
    totalMaterials.textContent = studyMaterials.length;
    lastLogin.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Download material (simulated)
function downloadMaterial(materialId) {
    const material = studyMaterials.find(m => m.id === materialId);
    if (material) {
        showNotification(`Downloading ${material.fileName}...`, 'info');
        
        // Simulate download
        setTimeout(() => {
            showNotification(`${material.fileName} downloaded successfully!`, 'success');
        }, 1500);
    }
}

// View material (simulated)
function viewMaterial(materialId) {
    const material = studyMaterials.find(m => m.id === materialId);
    if (material) {
        showNotification(`Opening ${material.fileName}...`, 'info');
        
        // Simulate opening file
        setTimeout(() => {
            showNotification(`${material.fileName} opened in new tab`, 'success');
        }, 1000);
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

// Add some sample data on first load
if (!localStorage.getItem('materialsLoaded')) {
    localStorage.setItem('materialsLoaded', 'true');
    // Materials are already defined in the global variable
}
