// Bulgaria Trip PWA JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Tab Navigation
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active button
            navBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update active tab
            tabContents.forEach(tab => tab.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Day Selector
    const dayBtns = document.querySelectorAll('.day-btn');
    const daySchedules = document.querySelectorAll('.day-schedule');
    
    dayBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            
            // Update active button
            dayBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update active schedule
            daySchedules.forEach(schedule => schedule.classList.remove('active'));
            document.querySelector(`.day-schedule[data-day="${day}"]`).classList.add('active');
        });
    });
    
    // Currency Converter
    const amountInput = document.getElementById('amount');
    const fromCurrency = document.getElementById('from-currency');
    const resultSpan = document.getElementById('result');
    
    // Exchange rates (approximate)
    const exchangeRates = {
        'ILS': 1.8645, // 1 ILS = 1.8645 BGN
        'EUR': 1.956,  // 1 EUR = 1.956 BGN
        'USD': 1.82    // 1 USD = 1.82 BGN
    };
    
    function convertCurrency() {
        const amount = parseFloat(amountInput.value) || 0;
        const from = fromCurrency.value;
        const rate = exchangeRates[from];
        const result = (amount * rate).toFixed(2);
        resultSpan.textContent = `~${result} BGN`;
    }
    
    amountInput.addEventListener('input', convertCurrency);
    fromCurrency.addEventListener('change', convertCurrency);
    
    // Checklist Progress
    const packChecks = document.querySelectorAll('.pack-check');
    const progressFill = document.getElementById('pack-progress');
    
    function updateProgress() {
        const total = packChecks.length;
        const checked = document.querySelectorAll('.pack-check:checked').length;
        const percentage = Math.round((checked / total) * 100);
        progressFill.style.width = `${percentage}%`;
        progressFill.textContent = `${percentage}% נארז`;
    }
    
    packChecks.forEach(check => {
        check.addEventListener('change', updateProgress);
    });
    
    // Save Notes
    const saveNotesBtn = document.getElementById('save-notes');
    const personalNotes = document.getElementById('personal-notes');
    
    // Load saved notes
    const savedNotes = localStorage.getItem('bulgaria-notes');
    if (savedNotes) {
        personalNotes.value = savedNotes;
    }
    
    saveNotesBtn.addEventListener('click', function() {
        localStorage.setItem('bulgaria-notes', personalNotes.value);
        alert('ההערות נשמרו!');
    });
    
    // Save checkbox states
    function saveCheckboxStates() {
        const states = {};
        document.querySelectorAll('.activity-check, .pack-check').forEach((checkbox, index) => {
            states[`checkbox-${index}`] = checkbox.checked;
        });
        localStorage.setItem('bulgaria-checkboxes', JSON.stringify(states));
    }
    
    // Load checkbox states
    function loadCheckboxStates() {
        const saved = localStorage.getItem('bulgaria-checkboxes');
        if (saved) {
            const states = JSON.parse(saved);
            document.querySelectorAll('.activity-check, .pack-check').forEach((checkbox, index) => {
                if (states[`checkbox-${index}`] !== undefined) {
                    checkbox.checked = states[`checkbox-${index}`];
                }
            });
            updateProgress();
        }
    }
    
    // Add event listeners to all checkboxes
    document.querySelectorAll('.activity-check, .pack-check').forEach(checkbox => {
        checkbox.addEventListener('change', saveCheckboxStates);
    });
    
    // Load states on page load
    loadCheckboxStates();
    
    // PWA Installation
    let deferredPrompt;
    const installBtn = document.getElementById('install-btn');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'block';
    });
    
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installBtn.style.display = 'none';
            }
            deferredPrompt = null;
        }
    });
    
    window.addEventListener('appinstalled', () => {
        installBtn.style.display = 'none';
    });
    
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registered:', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
        });
    }

    // === Photo Upload Module ===
    const MAX_PHOTOS = 50;
    const MAX_WIDTH = 1920;
    const MAX_HEIGHT = 1920;
    const QUALITY = 0.8;
    const THUMB_SIZE = 200;

    let uploadedPhotos = [];
    let currentEventId = 'bulgaria-2026';

    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');
    const cameraBtn = document.getElementById('camera-btn');
    const galleryBtn = document.getElementById('gallery-btn');
    const photoGrid = document.getElementById('photo-grid');
    const photoCount = document.getElementById('photo-count');
    const uploadProgress = document.getElementById('upload-progress');
    const uploadProgressFill = document.getElementById('upload-progress-fill');
    const savePhotosBtn = document.getElementById('save-photos');
    const doneWithoutBtn = document.getElementById('done-without-photos');
    const photoModal = document.getElementById('photo-modal');
    const modalImage = document.getElementById('modal-image');
    const modalClose = document.getElementById('modal-close');
    const modalDelete = document.getElementById('modal-delete');
    const modalDownload = document.getElementById('modal-download');

    let selectedPhotoIndex = -1;

    // Load saved photos
    function loadSavedPhotos() {
        const saved = localStorage.getItem(`photos-${currentEventId}`);
        if (saved) {
            uploadedPhotos = JSON.parse(saved);
            updatePhotoUI();
        }
    }

    // Update UI
    function updatePhotoUI() {
        photoCount.textContent = uploadedPhotos.length;
        savePhotosBtn.textContent = `שמור תמונות (${uploadedPhotos.length})`;
        savePhotosBtn.disabled = uploadedPhotos.length === 0;

        photoGrid.innerHTML = '';
        uploadedPhotos.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'photo-item';
            item.innerHTML = `
                <img src="${photo.thumb}" alt="תמונה ${index + 1}">
                <button class="photo-delete" data-index="${index}">✕</button>
                <div class="photo-status">${photo.status === 'uploaded' ? '✓' : '⏳'}</div>
            `;
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('photo-delete')) {
                    openModal(index);
                }
            });
            photoGrid.appendChild(item);
        });

        // Delete buttons
        document.querySelectorAll('.photo-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                deletePhoto(idx);
            });
        });
    }

    // Compress image
    function compressImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;

                    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                    }, 'image/jpeg', QUALITY);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // Create thumbnail
    function createThumbnail(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;
                    const ratio = Math.min(THUMB_SIZE / width, THUMB_SIZE / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // Process files
    async function processFiles(files) {
        const remaining = MAX_PHOTOS - uploadedPhotos.length;
        if (remaining <= 0) {
            alert(`לא ניתן להעלות יותר מ-${MAX_PHOTOS} תמונות`);
            return;
        }

        const filesToProcess = Array.from(files).slice(0, remaining);
        if (files.length > remaining) {
            alert(`ניתן להעלות עוד ${remaining} תמונות בלבד`);
        }

        uploadProgress.style.display = 'block';

        for (let i = 0; i < filesToProcess.length; i++) {
            const file = filesToProcess[i];
            if (!file.type.startsWith('image/')) continue;

            uploadProgressFill.style.width = `${((i + 1) / filesToProcess.length) * 100}%`;

            const thumb = await createThumbnail(file);
            const compressed = await compressImage(file);

            const photoData = {
                id: Date.now() + '-' + i,
                name: file.name,
                thumb: thumb,
                full: null,
                status: 'pending',
                eventId: currentEventId,
                timestamp: new Date().toISOString()
            };

            // Convert compressed to base64 for storage
            const reader = new FileReader();
            reader.onload = (e) => {
                photoData.full = e.target.result;
                photoData.status = 'uploaded';
                updatePhotoUI();
            };
            reader.readAsDataURL(compressed);

            uploadedPhotos.push(photoData);
        }

        updatePhotoUI();
        uploadProgress.style.display = 'none';
        uploadProgressFill.style.width = '0%';
    }

    // Delete photo
    function deletePhoto(index) {
        if (confirm('למחוק את התמונה?')) {
            uploadedPhotos.splice(index, 1);
            updatePhotoUI();
            saveToLocalStorage();
        }
    }

    // Save to localStorage
    function saveToLocalStorage() {
        localStorage.setItem(`photos-${currentEventId}`, JSON.stringify(uploadedPhotos));
    }

    // Modal
    function openModal(index) {
        selectedPhotoIndex = index;
        modalImage.src = uploadedPhotos[index].full || uploadedPhotos[index].thumb;
        photoModal.style.display = 'flex';
    }

    function closeModal() {
        photoModal.style.display = 'none';
        selectedPhotoIndex = -1;
    }

    // Event listeners
    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            processFiles(e.dataTransfer.files);
        });
    }

    if (cameraBtn) {
        cameraBtn.addEventListener('click', () => {
            fileInput.setAttribute('capture', 'environment');
            fileInput.click();
        });
    }

    if (galleryBtn) {
        galleryBtn.addEventListener('click', () => {
            fileInput.removeAttribute('capture');
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            processFiles(e.target.files);
            fileInput.value = '';
        });
    }

    if (savePhotosBtn) {
        savePhotosBtn.addEventListener('click', () => {
            saveToLocalStorage();
            alert(`נשמרו ${uploadedPhotos.length} תמונות בהצלחה!`);
        });
    }

    if (doneWithoutBtn) {
        doneWithoutBtn.addEventListener('click', () => {
            if (uploadedPhotos.length === 0) {
                alert('UInteger');
            } else {
                if (confirm(`לסיים עם ${uploadedPhotos.length} תמונות שצולמו?`)) {
                    saveToLocalStorage();
                    alert('הטיול הושלם! התמונות נשמרו.');
                }
            }
        });
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (photoModal) {
        photoModal.addEventListener('click', (e) => {
            if (e.target === photoModal) closeModal();
        });
    }

    if (modalDelete) {
        modalDelete.addEventListener('click', () => {
            if (selectedPhotoIndex >= 0) {
                deletePhoto(selectedPhotoIndex);
                closeModal();
            }
        });
    }

    if (modalDownload) {
        modalDownload.addEventListener('click', () => {
            if (selectedPhotoIndex >= 0) {
                const photo = uploadedPhotos[selectedPhotoIndex];
                const link = document.createElement('a');
                link.href = photo.full || photo.thumb;
                link.download = photo.name || 'photo.jpg';
                link.click();
            }
        });
    }

    loadSavedPhotos();
});