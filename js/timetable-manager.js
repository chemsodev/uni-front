/**
 * Timetable Management JavaScript
 * Handles uploading and managing timetable documents for sections
 */

// Use existing API_BASE_URL if it exists, otherwise set default
var API_BASE_URL = window.API_BASE_URL || 'https://unicersityback.onrender.com/api';

// Function to initialize the timetable upload functionality
function initializeTimetableUpload() {
    // Add event listeners to timetable upload buttons
    document.addEventListener('click', function(event) {
        // Check for upload timetable button clicks
        if (event.target.closest('.upload-timetable-btn')) {
            const button = event.target.closest('.upload-timetable-btn');
            const sectionId = button.getAttribute('data-id');
            const sectionName = button.getAttribute('data-name');
            const specialty = button.getAttribute('data-specialty');
            const level = button.getAttribute('data-level');
            
            openTimetableModal({
                id: sectionId,
                name: sectionName,
                specialty: specialty,
                level: level
            }, 'regular');
        }
        
        // Check for upload exam button clicks
        if (event.target.closest('.upload-exam-btn')) {
            const button = event.target.closest('.upload-exam-btn');
            const sectionId = button.getAttribute('data-id');
            const sectionName = button.getAttribute('data-name');
            const specialty = button.getAttribute('data-specialty');
            const level = button.getAttribute('data-level');
            
            openTimetableModal({
                id: sectionId,
                name: sectionName,
                specialty: specialty,
                level: level
            }, 'exam');
        }
    });
    
    // Set up timetable modal event listeners
    setupTimetableModalListeners();
}

// Function to open the timetable upload modal
function openTimetableModal(section, type) {
    const timetableModal = document.getElementById('timetable-modal');
    const timetableModalTitle = document.getElementById('timetable-modal-title');
    const timetableSectionIdInput = document.getElementById('timetable-section-id');
    const timetableTypeInput = document.getElementById('timetable-type');
    const timetableTitleInput = document.getElementById('timetable-title');
    const timetableAcademicYearInput = document.getElementById('timetable-academic-year');
    
    // Set modal title based on type
    if (type === 'exam') {
        timetableModalTitle.textContent = `Télécharger l'emploi des examens - Section ${section.name} (${section.level})`;
        timetableTitleInput.value = `Emploi des examens - ${section.specialty} ${section.level} - Section ${section.name}`;
    } else {
        timetableModalTitle.textContent = `Télécharger l'emploi du temps - Section ${section.name} (${section.level})`;
        timetableTitleInput.value = `Emploi du temps - ${section.specialty} ${section.level} - Section ${section.name}`;
    }
    
    // Reset form and set default values
    document.getElementById('timetable-form').reset();
    timetableSectionIdInput.value = section.id;
    timetableTypeInput.value = type;
    timetableTitleInput.value = timetableTitleInput.value; // Re-apply the title we just set
    
    // Set academic year to current year
    const currentYear = new Date().getFullYear();
    timetableAcademicYearInput.value = `${currentYear}-${currentYear + 1}`;
    
    // Clear file selection
    document.getElementById('timetable-file').value = '';
    document.getElementById('selected-file').style.display = 'none';
    
    // Show modal
    timetableModal.style.display = 'block';
}

// Function to set up timetable modal event listeners
function setupTimetableModalListeners() {
    const timetableModal = document.getElementById('timetable-modal');
    const timetableForm = document.getElementById('timetable-form');
    const timetableFileInput = document.getElementById('timetable-file');
    const fileUploadContainer = document.getElementById('file-upload-container');
    const selectedFileContainer = document.getElementById('selected-file');
    const selectedFileName = document.getElementById('selected-file-name');
    const selectedFileRemove = document.getElementById('selected-file-remove');
    
    // Modal close buttons
    document.getElementById('close-timetable-modal').addEventListener('click', () => {
        timetableModal.style.display = 'none';
    });
    
    document.getElementById('cancel-timetable-btn').addEventListener('click', () => {
        timetableModal.style.display = 'none';
    });
    
    // File upload handling
    timetableFileInput.addEventListener('change', () => {
        const file = timetableFileInput.files[0];
        
        if (file) {
            selectedFileName.textContent = file.name;
            selectedFileContainer.style.display = 'flex';
        } else {
            selectedFileContainer.style.display = 'none';
        }
    });
    
    selectedFileRemove.addEventListener('click', () => {
        timetableFileInput.value = '';
        selectedFileContainer.style.display = 'none';
    });
    
    // Drag and drop for file upload
    fileUploadContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadContainer.classList.add('dragover');
    });
    
    fileUploadContainer.addEventListener('dragleave', () => {
        fileUploadContainer.classList.remove('dragover');
    });
    
    fileUploadContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadContainer.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            timetableFileInput.files = e.dataTransfer.files;
            const file = timetableFileInput.files[0];
            if (file) {
                selectedFileName.textContent = file.name;
                selectedFileContainer.style.display = 'flex';
            }
        }
    });
    
    // Form submission
    timetableForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const file = timetableFileInput.files[0];
        
        if (!file) {
            showMessage('Veuillez sélectionner un fichier à télécharger.', 'error');
            return;
        }
        
        // Get authentication token
        const authToken = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
        if (!authToken) {
            showMessage('Vous n\'êtes pas authentifié. Veuillez vous reconnecter.', 'error');
            return;
        }
        
        // Create FormData object
        const formData = new FormData();
        formData.append('document', file);
        formData.append('title', document.getElementById('timetable-title').value);
        formData.append('description', document.getElementById('timetable-description').value);
        formData.append('scheduleType', document.getElementById('timetable-type').value);
        formData.append('sectionId', document.getElementById('timetable-section-id').value);
        formData.append('semester', document.getElementById('timetable-semester').value);
        formData.append('academicYear', document.getElementById('timetable-academic-year').value);
        
        try {
            showMessage('Téléchargement de l\'emploi du temps...', 'info');
            
            // Upload the file
            const response = await fetch(`${API_BASE_URL}/schedules/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            // Close modal
            timetableModal.style.display = 'none';
            
            showMessage('Emploi du temps téléchargé avec succès!', 'success');
        } catch (error) {
            console.error('Error uploading timetable:', error);
            showMessage(`Erreur lors du téléchargement de l'emploi du temps: ${error.message}`, 'error');
        }
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === timetableModal) {
            timetableModal.style.display = 'none';
        }
    });
}

// Function to view timetables for a section
async function viewSectionTimetables(sectionId, sectionName) {
    try {
        showMessage('Chargement des emplois du temps...', 'info');
        
        // Get authentication token
        const authToken = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
        if (!authToken) {
            showMessage('Vous n\'êtes pas authentifié. Veuillez vous reconnecter.', 'error');
            return;
        }
        
        // Fetch regular timetables for the section
        const response = await fetch(`${API_BASE_URL}/schedules/section/${sectionId}/type/regular`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const timetables = await response.json();
        
        // Fetch exam timetables for the section
        const examResponse = await fetch(`${API_BASE_URL}/schedules/section/${sectionId}/type/exam`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!examResponse.ok) {
            throw new Error(`Error ${examResponse.status}: ${examResponse.statusText}`);
        }
        
        const examTimetables = await examResponse.json();
        
        // Display the timetables in a modal
        displayTimetablesModal(sectionName, timetables, examTimetables);
        
        showMessage('', 'clear');
    } catch (error) {
        console.error('Error loading timetables:', error);
        showMessage(`Erreur lors du chargement des emplois du temps: ${error.message}`, 'error');
    }
}

// Function to display timetables in a modal
function displayTimetablesModal(sectionName, regularTimetables, examTimetables) {
    const modal = document.getElementById('view-timetables-modal');
    const modalTitle = document.getElementById('view-timetables-modal-title');
    const regularTimetablesList = document.getElementById('regular-timetables-list');
    const examTimetablesList = document.getElementById('exam-timetables-list');
    
    // Set modal title
    modalTitle.textContent = `Emplois du temps - Section ${sectionName}`;
    
    // Clear previous content
    regularTimetablesList.innerHTML = '';
    examTimetablesList.innerHTML = '';
    
    // Add regular timetables
    if (regularTimetables && regularTimetables.length > 0) {
        regularTimetables.forEach(timetable => {
            const timetableItem = createTimetableItem(timetable);
            regularTimetablesList.appendChild(timetableItem);
        });
    } else {
        regularTimetablesList.innerHTML = '<div class="no-timetables">Aucun emploi du temps disponible</div>';
    }
    
    // Add exam timetables
    if (examTimetables && examTimetables.length > 0) {
        examTimetables.forEach(timetable => {
            const timetableItem = createTimetableItem(timetable);
            examTimetablesList.appendChild(timetableItem);
        });
    } else {
        examTimetablesList.innerHTML = '<div class="no-timetables">Aucun emploi des examens disponible</div>';
    }
    
    // Set up tab switching
    setupTabs();
    
    // Show modal
    modal.style.display = 'block';
    
    // Add event listener to close modal button
    document.getElementById('close-view-timetables-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Function to create a timetable item for the list
function createTimetableItem(timetable) {
    const item = document.createElement('div');
    item.className = 'timetable-item';
    
    const date = new Date(timetable.createdAt);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    
    item.innerHTML = `
        <div class="timetable-info">
            <div class="timetable-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
                    <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"></path>
                </svg>
            </div>
            <div class="timetable-details">
                <h3 class="timetable-title">${timetable.title}</h3>
                <p class="timetable-description">${timetable.description || 'Aucune description'}</p>
                <div class="timetable-meta">
                    <span class="timetable-date">Ajouté le ${formattedDate}</span>
                    <span class="timetable-semester">${timetable.semester || ''}</span>
                    <span class="timetable-academic-year">${timetable.academicYear || ''}</span>
                </div>
            </div>
        </div>
        <div class="timetable-actions">
            <a href="${API_BASE_URL}/schedules/${timetable.id}/document" target="_blank" class="timetable-download-btn" title="Télécharger">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            </a>
        </div>
    `;
    
    return item;
}

// Function to setup tabs in the view timetables modal
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Function to show status messages
function showMessage(message, type = 'info') {
    const statusMessage = document.getElementById('status-message');
    
    if (type === 'clear') {
        statusMessage.style.display = 'none';
        return;
    }
    
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';
    
    switch (type) {
        case 'success':
            statusMessage.classList.add('success');
            break;
        case 'error':
            statusMessage.classList.add('error');
            break;
        case 'warning':
            statusMessage.classList.add('warning');
            break;
        default:
            statusMessage.classList.add('info');
    }
    
    statusMessage.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
}

// Initialize the timetable functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTimetableUpload);
