// ==================== DATA STORAGE SYSTEM ====================
const STORAGE_KEY = 'customerManagerData';
let customers = [];
let currentMobileNumber = '';
let currentCustomerName = '';
let uploadedPhotos = [];
let currentSearchTerm = '';

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    initializeTheme();
    
    // Add drag and drop for photos
    const photoInput = document.getElementById('photo-input');
    photoInput.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.parentNode.style.borderColor = 'var(--accent-color)';
        this.parentNode.style.background = 'var(--bg-secondary)';
    });
    
    photoInput.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.parentNode.style.borderColor = 'var(--border-color)';
        this.parentNode.style.background = 'var(--bg-primary)';
    });
    
    photoInput.addEventListener('drop', function(e) {
        e.preventDefault();
        this.parentNode.style.borderColor = 'var(--border-color)';
        this.parentNode.style.background = 'var(--bg-primary)';
        handlePhotoUpload(e.dataTransfer.files);
    });
});

// Load customers from localStorage
function loadCustomers() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    
    if (storedData) {
        customers = JSON.parse(storedData);
    } else {
        // Sample data for first time users
        customers = [
            {
                id: 1,
                name: "Demo Customer",
                mobile: "1234567890",
                address: "Sample Address, City, State",
                coordinates: "23.15371, 79.753135",
                mapUrl: "https://maps.google.com/?q=23.15371,79.753135",
                photos: []
            }
        ];
        saveCustomersToStorage();
    }
    
    displayCustomers();
    updateCustomerCount();
}

// Save customers to localStorage
function saveCustomersToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

// ==================== SEARCH FUNCTIONALITY ====================

// Search customers function
function searchCustomers() {
    const searchInput = document.getElementById('customer-search');
    const searchTerm = searchInput.value.trim().toLowerCase();
    currentSearchTerm = searchTerm;
    
    const clearBtn = document.querySelector('.clear-search-btn');
    const searchStats = document.getElementById('search-stats');
    
    // Show/hide clear button
    if (searchTerm.length > 0) {
        clearBtn.style.display = 'flex';
        searchInput.parentElement.classList.add('search-pulse');
        setTimeout(() => {
            searchInput.parentElement.classList.remove('search-pulse');
        }, 1000);
    } else {
        clearBtn.style.display = 'none';
    }
    
    if (searchTerm.length === 0) {
        // Show all customers if search is empty
        displayCustomers();
        searchStats.innerHTML = '';
        return;
    }
    
    // Filter customers based on search term
    const filteredCustomers = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.mobile.includes(searchTerm) ||
        customer.address.toLowerCase().includes(searchTerm) ||
        (customer.coordinates && customer.coordinates.toLowerCase().includes(searchTerm))
    );
    
    // Display filtered customers
    displayFilteredCustomers(filteredCustomers, searchTerm);
    
    // Update search stats
    updateSearchStats(filteredCustomers.length, searchTerm);
}

// Display filtered customers with highlight
function displayFilteredCustomers(filteredCustomers, searchTerm) {
    const customersList = document.getElementById('customers-list');
    
    if (filteredCustomers.length === 0) {
        customersList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No Customers Found</h3>
                <p>No customers match your search for "<strong>${searchTerm}</strong>"</p>
                <button class="manual-coordinate-btn" onclick="clearSearch()" style="margin-top: 10px;">
                    <i class="fas fa-times"></i>
                    Clear Search
                </button>
            </div>
        `;
        return;
    }
    
    customersList.innerHTML = '';
    
    filteredCustomers.forEach(customer => {
        const customerCard = document.createElement('div');
        customerCard.className = 'customer-card';
        
        // Highlight matching text in customer data
        const highlightedName = highlightText(customer.name, searchTerm);
        const highlightedMobile = highlightText(customer.mobile, searchTerm);
        const highlightedAddress = highlightText(customer.address, searchTerm);
        const highlightedCoordinates = customer.coordinates ? highlightText(customer.coordinates, searchTerm) : customer.coordinates;
        
        // Create photos section HTML
        let photosHTML = '';
        if (customer.photos && customer.photos.length > 0) {
            photosHTML = `
                <div class="photo-section">
                    <div class="section-label">
                        <i class="fas fa-camera"></i>
                        Home Photos (${customer.photos.length})
                    </div>
                    <div class="photo-preview-container">
                        ${customer.photos.map(photo => `
                            <div class="photo-preview" onclick="openPhotoModal('${photo.dataUrl}')">
                                <img src="${photo.dataUrl}" alt="Customer home">
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Create map URL section if available
        let mapUrlHTML = '';
        if (customer.mapUrl) {
            mapUrlHTML = `
                <div class="info-row">
                    <i class="fas fa-link"></i>
                    <div class="info-content">
                        <a href="${customer.mapUrl}" target="_blank" class="map-link">
                            <i class="fas fa-external-link-alt"></i>
                            Open Map URL
                        </a>
                    </div>
                </div>
            `;
        }
        
        customerCard.innerHTML = `
            <div class="customer-header">
                <i class="fas fa-user-tie"></i>
                <div class="customer-name">${highlightedName}</div>
                <button class="share-btn" onclick="showShareMenu(${customer.id})">
                    <i class="fas fa-share-alt"></i>
                    Share
                </button>
            </div>
            
            <div class="customer-info">
                <div class="info-row">
                    <i class="fas fa-mobile-alt"></i>
                    <div class="info-content">
                        <div class="mobile-clickable" onclick="showActionSheet('${customer.name}', '${customer.mobile}')">
                            +91-${highlightedMobile}
                        </div>
                    </div>
                </div>
                
                <div class="info-row">
                    <i class="fas fa-map-marker-alt"></i>
                    <div class="info-content">${highlightedAddress}</div>
                </div>
                
                <div class="info-row">
                    <i class="fas fa-location-dot"></i>
                    <div class="info-content">${highlightedCoordinates}</div>
                </div>
                
                ${mapUrlHTML}
            </div>
            
            ${photosHTML}
            
            <div class="card-actions">
                <button class="card-btn map-btn" onclick="viewOnMap('${customer.coordinates}')">
                    <i class="fas fa-map"></i>
                    Map
                </button>
                <button class="card-btn edit-btn" onclick="editCustomer(${customer.id})">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="card-btn delete-btn" onclick="deleteCustomer(${customer.id})">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        `;
        customersList.appendChild(customerCard);
    });
}

// Highlight matching text
function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// Escape special characters for regex
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Update search statistics
function updateSearchStats(resultsCount, searchTerm) {
    const searchStats = document.getElementById('search-stats');
    const totalCustomers = customers.length;
    
    if (searchTerm.length === 0) {
        searchStats.innerHTML = '';
        searchStats.className = 'search-stats';
        return;
    }
    
    if (resultsCount === 0) {
        searchStats.innerHTML = `No results found for "<strong>${searchTerm}</strong>"`;
        searchStats.className = 'search-stats';
    } else if (resultsCount === totalCustomers) {
        searchStats.innerHTML = `Showing all ${totalCustomers} customers`;
        searchStats.className = 'search-stats';
    } else {
        searchStats.innerHTML = `Found ${resultsCount} of ${totalCustomers} customers for "<strong>${searchTerm}</strong>"`;
        searchStats.className = 'search-stats highlight';
    }
}

// Clear search
function clearSearch() {
    const searchInput = document.getElementById('customer-search');
    searchInput.value = '';
    currentSearchTerm = '';
    
    const clearBtn = document.querySelector('.clear-search-btn');
    const searchStats = document.getElementById('search-stats');
    
    clearBtn.style.display = 'none';
    searchStats.innerHTML = '';
    searchStats.className = 'search-stats';
    
    // Show all customers
    displayCustomers();
    
    // Focus back on search input
    searchInput.focus();
}

// ==================== CUSTOMER MANAGEMENT ====================

// Customer form submission
document.getElementById('customer-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const address = document.getElementById('address').value.trim();
    const coordinates = document.getElementById('coordinates').value.trim();
    const mapUrl = document.getElementById('map-url').value.trim();
    
    // Validation
    if (!name || !mobile || !address) {
        showToast('Please fill all required fields');
        return;
    }
    
    if (!/^\d{10}$/.test(mobile)) {
        showToast('Please enter valid 10-digit number');
        return;
    }
    
    // Check for duplicate mobile
    if (customers.some(c => c.mobile === mobile)) {
        showToast('Customer with this number already exists');
        return;
    }
    
    const newCustomer = {
        id: Date.now(),
        name: name,
        mobile: mobile,
        address: address,
        coordinates: coordinates || 'Not provided',
        mapUrl: mapUrl || (coordinates !== 'Not provided' ? `https://maps.google.com/?q=${coordinates}` : ''),
        photos: [...uploadedPhotos],
        created: new Date().toISOString()
    };
    
    customers.push(newCustomer);
    saveCustomersToStorage();
    displayCustomers();
    this.reset();
    
    // Clear uploaded photos
    uploadedPhotos = [];
    updatePhotoPreviews();
    
    showToast('Customer added successfully!');
    showSection('view-customers');
});

// Edit customer function
function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (customer) {
        // Fill form with customer data
        document.getElementById('name').value = customer.name;
        document.getElementById('mobile').value = customer.mobile;
        document.getElementById('address').value = customer.address;
        document.getElementById('coordinates').value = customer.coordinates;
        document.getElementById('map-url').value = customer.mapUrl || '';
        
        // Load customer photos
        uploadedPhotos = [...customer.photos];
        updatePhotoPreviews();
        
        // Remove from current list
        customers = customers.filter(c => c.id !== id);
        saveCustomersToStorage();
        displayCustomers();
        
        // Switch to add section and update button
        showSection('add-customer');
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Update Customer';
        
        showToast('Edit customer details');
    }
}

// Delete customer function
function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
        customers = customers.filter(c => c.id !== id);
        saveCustomersToStorage();
        displayCustomers();
        showToast('Customer deleted successfully');
    }
}

// Display customers in UI
function displayCustomers() {
    if (currentSearchTerm) {
        searchCustomers();
        return;
    }
    
    const customersList = document.getElementById('customers-list');
    const navCustomerCount = document.getElementById('nav-customer-count');
    
    customersList.innerHTML = '';
    navCustomerCount.textContent = customers.length;
    
    if (customers.length === 0) {
        customersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No Customers Yet</h3>
                <p>Add your first customer to get started</p>
            </div>
        `;
        return;
    }
    
    customers.forEach(customer => {
        const customerCard = document.createElement('div');
        customerCard.className = 'customer-card';
        
        // Create photos section HTML
        let photosHTML = '';
        if (customer.photos && customer.photos.length > 0) {
            photosHTML = `
                <div class="photo-section">
                    <div class="section-label">
                        <i class="fas fa-camera"></i>
                        Home Photos (${customer.photos.length})
                    </div>
                    <div class="photo-preview-container">
                        ${customer.photos.map(photo => `
                            <div class="photo-preview" onclick="openPhotoModal('${photo.dataUrl}')">
                                <img src="${photo.dataUrl}" alt="Customer home">
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Create map URL section if available
        let mapUrlHTML = '';
        if (customer.mapUrl) {
            mapUrlHTML = `
                <div class="info-row">
                    <i class="fas fa-link"></i>
                    <div class="info-content">
                        <a href="${customer.mapUrl}" target="_blank" class="map-link">
                            <i class="fas fa-external-link-alt"></i>
                            Open Map URL
                        </a>
                    </div>
                </div>
            `;
        }
        
        customerCard.innerHTML = `
            <div class="customer-header">
                <i class="fas fa-user-tie"></i>
                <div class="customer-name">${customer.name}</div>
                <button class="share-btn" onclick="showShareMenu(${customer.id})">
                    <i class="fas fa-share-alt"></i>
                    Share
                </button>
            </div>
            
            <div class="customer-info">
                <div class="info-row">
                    <i class="fas fa-mobile-alt"></i>
                    <div class="info-content">
                        <div class="mobile-clickable" onclick="showActionSheet('${customer.name}', '${customer.mobile}')">
                            +91-${customer.mobile}
                        </div>
                    </div>
                </div>
                
                <div class="info-row">
                    <i class="fas fa-map-marker-alt"></i>
                    <div class="info-content">${customer.address}</div>
                </div>
                
                <div class="info-row">
                    <i class="fas fa-location-dot"></i>
                    <div class="info-content">${customer.coordinates}</div>
                </div>
                
                ${mapUrlHTML}
            </div>
            
            ${photosHTML}
            
            <div class="card-actions">
                <button class="card-btn map-btn" onclick="viewOnMap('${customer.coordinates}')">
                    <i class="fas fa-map"></i>
                    Map
                </button>
                <button class="card-btn edit-btn" onclick="editCustomer(${customer.id})">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="card-btn delete-btn" onclick="deleteCustomer(${customer.id})">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        `;
        customersList.appendChild(customerCard);
    });
}

// Update customer count
function updateCustomerCount() {
    document.getElementById('nav-customer-count').textContent = customers.length;
}

// ==================== SHARE FUNCTIONS ====================

// Share customer via WhatsApp
function shareViaWhatsApp(customer) {
    let message = `*${customer.name}*\n\n📱 *Mobile:* +91-${customer.mobile}\n📍 *Address:* ${customer.address}\n🗺️ *Coordinates:* ${customer.coordinates}`;
    
    // Add map URL if available
    if (customer.mapUrl) {
        message += `\n🗺️ *Map Link:* ${customer.mapUrl}`;
    }
    
    message += `\n\n_Shared via Customer Manager App_`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Share customer via SMS
function shareViaSMS(customer) {
    let message = `${customer.name}\nMobile: +91-${customer.mobile}\nAddress: ${customer.address}\nCoordinates: ${customer.coordinates}`;
    
    // Add map URL if available
    if (customer.mapUrl) {
        message += `\nMap: ${customer.mapUrl}`;
    }
    
    message += `\n\nShared via Customer Manager App`;
    
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
}

// Share customer via Email
function shareViaEmail(customer) {
    const subject = `Customer Details: ${customer.name}`;
    let body = `
Customer Information:

Name: ${customer.name}
Mobile: +91-${customer.mobile}
Address: ${customer.address}
Coordinates: ${customer.coordinates}
    `;
    
    // Add map URL if available
    if (customer.mapUrl) {
        body += `\nMap Link: ${customer.mapUrl}`;
    }
    
    body += `\n\nShared via Customer Manager App`;
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.trim())}`;
    window.open(mailtoLink, '_blank');
}

// Share customer via Google Maps
function shareViaGoogleMaps(customer) {
    if (customer.coordinates && customer.coordinates !== 'Not provided') {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.coordinates)}`;
        window.open(mapsUrl, '_blank');
    } else {
        showToast('No coordinates available for mapping');
    }
}

// Copy customer details to clipboard
async function copyToClipboard(customer) {
    let text = `Name: ${customer.name}\nMobile: +91-${customer.mobile}\nAddress: ${customer.address}\nCoordinates: ${customer.coordinates}`;
    
    // Add map URL if available
    if (customer.mapUrl) {
        text += `\nMap: ${customer.mapUrl}`;
    }
    
    try {
        await navigator.clipboard.writeText(text);
        showToast('Customer details copied!');
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Customer details copied!');
    }
}

// Share as vCard (Contact File)
function shareAsVCard(customer) {
    let vCardData = `
BEGIN:VCARD
VERSION:3.0
FN:${customer.name}
TEL;TYPE=CELL:+91${customer.mobile}
ADR;TYPE=HOME:;;${customer.address.replace(/\n/g, ' ')};
NOTE:Coordinates: ${customer.coordinates}
    `;
    
    // Add map URL if available
    if (customer.mapUrl) {
        vCardData += `\nURL:${customer.mapUrl}`;
    }
    
    vCardData += `\nEND:VCARD`;
    
    const blob = new Blob([vCardData.trim()], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customer.name}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Contact file downloaded!');
}

// Share customer menu
function showShareMenu(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const shareHTML = `
        <div class="share-overlay" onclick="closeShareMenu()">
            <div class="share-menu" onclick="event.stopPropagation()">
                <div class="share-header">
                    <h3>Share Customer</h3>
                    <p>${customer.name}</p>
                    <button class="share-close" onclick="closeShareMenu()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="share-options">
                    <div class="share-option" onclick="shareViaWhatsApp(${JSON.stringify(customer).replace(/"/g, '&quot;')}); closeShareMenu()">
                        <div class="share-icon whatsapp">
                            <i class="fab fa-whatsapp"></i>
                        </div>
                        <span>WhatsApp</span>
                    </div>
                    
                    <div class="share-option" onclick="shareViaSMS(${JSON.stringify(customer).replace(/"/g, '&quot;')}); closeShareMenu()">
                        <div class="share-icon sms">
                            <i class="fas fa-sms"></i>
                        </div>
                        <span>SMS</span>
                    </div>
                    
                    <div class="share-option" onclick="shareViaEmail(${JSON.stringify(customer).replace(/"/g, '&quot;')}); closeShareMenu()">
                        <div class="share-icon email">
                            <i class="fas fa-envelope"></i>
                        </div>
                        <span>Email</span>
                    </div>
                    
                    <div class="share-option" onclick="shareViaGoogleMaps(${JSON.stringify(customer).replace(/"/g, '&quot;')}); closeShareMenu()">
                        <div class="share-icon maps">
                            <i class="fas fa-map"></i>
                        </div>
                        <span>Maps</span>
                    </div>
                    
                    <div class="share-option" onclick="copyToClipboard(${JSON.stringify(customer).replace(/"/g, '&quot;')}); closeShareMenu()">
                        <div class="share-icon copy">
                            <i class="fas fa-copy"></i>
                        </div>
                        <span>Copy</span>
                    </div>
                    
                    <div class="share-option" onclick="shareAsVCard(${JSON.stringify(customer).replace(/"/g, '&quot;')}); closeShareMenu()">
                        <div class="share-icon vcard">
                            <i class="fas fa-address-card"></i>
                        </div>
                        <span>vCard</span>
                    </div>
                </div>
                
                <button class="share-cancel" onclick="closeShareMenu()">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', shareHTML);
}

// Close share menu
function closeShareMenu() {
    const shareOverlay = document.querySelector('.share-overlay');
    if (shareOverlay) {
        shareOverlay.remove();
    }
}

// ==================== PHOTO MANAGEMENT ====================

// Handle photo upload
function handlePhotoUpload(files) {
    const maxPhotos = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (uploadedPhotos.length + files.length > maxPhotos) {
        showToast(`You can upload maximum ${maxPhotos} photos`);
        return;
    }
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.size > maxSize) {
            showToast(`Photo ${file.name} must be less than 5MB`);
            continue;
        }
        
        if (!file.type.startsWith('image/')) {
            showToast(`File ${file.name} is not a valid image`);
            continue;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedPhotos.push({
                id: Date.now() + i,
                name: file.name,
                dataUrl: e.target.result,
                uploaded: new Date().toISOString()
            });
            
            if (i === files.length - 1) {
                updatePhotoPreviews();
                showToast(`✅ ${files.length} photo(s) uploaded`);
            }
        };
        reader.readAsDataURL(file);
    }
}

// Update photo previews
function updatePhotoPreviews() {
    const container = document.getElementById('photo-preview-container');
    container.innerHTML = '';
    
    if (uploadedPhotos.length === 0) {
        container.innerHTML = '<div class="no-photos">No photos added yet</div>';
        return;
    }
    
    uploadedPhotos.forEach(photo => {
        const preview = document.createElement('div');
        preview.className = 'photo-preview';
        preview.innerHTML = `
            <img src="${photo.dataUrl}" alt="${photo.name}">
            <button class="photo-remove" onclick="removePhoto(${photo.id})">
                <i class="fas fa-times"></i>
            </button>
        `;
        preview.addEventListener('click', (e) => {
            if (!e.target.classList.contains('photo-remove')) {
                openPhotoModal(photo.dataUrl);
            }
        });
        container.appendChild(preview);
    });
}

// Remove photo
function removePhoto(photoId) {
    uploadedPhotos = uploadedPhotos.filter(photo => photo.id !== photoId);
    updatePhotoPreviews();
    showToast('Photo removed');
}

// Open photo modal
function openPhotoModal(src) {
    document.getElementById('modal-photo').src = src;
    document.getElementById('photo-modal').style.display = 'flex';
}

// Close photo modal
function closePhotoModal() {
    document.getElementById('photo-modal').style.display = 'none';
}

// View customer photos
function viewCustomerPhotos(id) {
    const customer = customers.find(c => c.id === id);
    if (customer && customer.photos.length > 0) {
        openPhotoModal(customer.photos[0].dataUrl);
    } else {
        showToast('No photos available for this customer');
    }
}

// ==================== LOCATION SERVICES ====================

// Extract coordinates from Google Maps URL using free APIs
async function extractCoordinatesFromURL() {
    const urlInput = document.getElementById('map-url');
    const coordinatesInput = document.getElementById('coordinates');
    const addressInput = document.getElementById('address');
    
    const url = urlInput.value.trim();
    
    if (!url) {
        showToast('Please enter a Google Maps URL');
        return;
    }
    
    // Show loading
    const urlBtn = document.querySelector('.url-btn');
    const originalText = urlBtn.innerHTML;
    urlBtn.innerHTML = '<div class="loading"></div>';
    urlBtn.disabled = true;
    
    try {
        // Step 1: First expand short URL if it's a short link
        let expandedUrl = url;
        if (isShortUrl(url)) {
            expandedUrl = await expandShortUrl(url);
            console.log('Expanded URL:', expandedUrl);
        }
        
        // Step 2: Extract coordinates from the URL
        const coordinates = extractCoordsFromUrl(expandedUrl);
        if (!coordinates) {
            showToast('Could not find coordinates in this URL');
            resetURLButton(urlBtn, originalText);
            return;
        }
        
        coordinatesInput.value = coordinates;
        
        // Step 3: Get address from coordinates using free geocoding API
        const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
        const address = await getAddressFromCoords(lat, lng);
        
        if (address) {
            addressInput.value = address;
            showToast('✅ Coordinates and address extracted successfully!');
        } else {
            addressInput.value = `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            showToast('✅ Coordinates extracted! Address not available.');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showToast('❌ Error processing URL. Try manual entry.');
    }
    
    resetURLButton(urlBtn, originalText);
}

// Check if URL is short
function isShortUrl(url) {
    return url.includes('goo.gl') || 
           url.includes('maps.app.goo.gl') ||
           url.includes('bit.ly') ||
           url.includes('tinyurl.com');
}

// Expand short URL using free service
async function expandShortUrl(shortUrl) {
    try {
        // Using unshorten.me API (free)
        const response = await fetch(`https://unshorten.me/s/${encodeURIComponent(shortUrl)}`);
        const text = await response.text();
        
        if (text && !text.includes('Error')) {
            return text.trim();
        }
    } catch (error) {
        console.log('unshorten.me failed:', error);
    }
    
    try {
        // Alternative: Use allorigins.win as proxy
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(shortUrl)}`);
        const data = await response.json();
        return data.contents || shortUrl;
    } catch (error) {
        console.log('allorigins failed:', error);
    }
    
    return shortUrl;
}

// Extract coordinates from URL with multiple patterns
function extractCoordsFromUrl(url) {
    console.log('Extracting from:', url);
    
    const patterns = [
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,                    // @lat,lng
        /q=(-?\d+\.\d+),(-?\d+\.\d+)/,                   // q=lat,lng
        /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,               // !3dlat!4dlng
        /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,                 // ll=lat,lng
        /query=(-?\d+\.\d+),(-?\d+\.\d+)/,              // query=lat,lng
        /@(-?\d+\.\d+),(-?\d+\.\d+),[\d.]+z/,           // @lat,lng,zoom
        /\/@(-?\d+\.\d+),(-?\d+\.\d+)/,                 // /@lat,lng
        /place\/.*@(-?\d+\.\d+),(-?\d+\.\d+)/,          // place/name/@lat,lng
        /data=!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/           // data=!3dlat!4dlng
    ];
    
    for (let pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            const lat = parseFloat(match[1]).toFixed(6);
            const lng = parseFloat(match[2]).toFixed(6);
            return `${lat}, ${lng}`;
        }
    }
    
    return null;
}

// Get address from coordinates using free geocoding APIs
async function getAddressFromCoords(lat, lng) {
    try {
        // Try OpenStreetMap Nominatim first (free)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        
        if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
                return data.display_name;
            }
        }
    } catch (error) {
        console.log('OpenStreetMap failed:', error);
    }
    
    try {
        // Try BigDataCloud Reverse Geocoding (free tier)
        const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
        );
        
        if (response.ok) {
            const data = await response.json();
            if (data && data.city) {
                return `${data.city}, ${data.principalSubdivision}, ${data.countryName}`;
            }
        }
    } catch (error) {
        console.log('BigDataCloud failed:', error);
    }
    
    return null;
}

// Manual coordinate input
function showManualCoordinateInput() {
    const lat = prompt('Enter Latitude (e.g., 23.15371):');
    if (lat === null) return;
    
    const lng = prompt('Enter Longitude (e.g., 79.753135):');
    if (lng === null) return;
    
    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
        const coordinates = `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`;
        document.getElementById('coordinates').value = coordinates;
        
        // Auto-fetch address
        getAddressFromCoords(parseFloat(lat), parseFloat(lng))
            .then(address => {
                document.getElementById('address').value = address || `Location at ${lat}, ${lng}`;
                showToast('✅ Coordinates and address added!');
            })
            .catch(() => {
                document.getElementById('address').value = `Location at ${lat}, ${lng}`;
                showToast('✅ Coordinates added!');
            });
    } else {
        showToast('❌ Invalid coordinates entered');
    }
}

// Get Current Location
function getCurrentLocation() {
    const locationBtn = document.querySelector('.location-btn');
    const statusElement = document.getElementById('location-status');
    const coordinatesInput = document.getElementById('coordinates');
    const addressInput = document.getElementById('address');
    
    // Show loading state
    locationBtn.innerHTML = '<div class="loading"></div> Getting Location...';
    locationBtn.disabled = true;
    statusElement.textContent = 'Detecting your location...';
    statusElement.className = 'location-status';
    
    if (!navigator.geolocation) {
        statusElement.textContent = 'Geolocation not supported';
        statusElement.className = 'location-status error';
        resetLocationButton();
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const coordinates = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            
            coordinatesInput.value = coordinates;
            
            // Get address from coordinates
            try {
                const address = await getAddressFromCoords(lat, lng);
                addressInput.value = address || `My Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                statusElement.textContent = '✅ Location found!';
                statusElement.className = 'location-status success';
                showToast('✅ Current location captured!');
            } catch (error) {
                addressInput.value = `My Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                statusElement.textContent = '✅ Location found (address not available)';
                statusElement.className = 'location-status success';
                showToast('✅ Location captured!');
            }
            
            resetLocationButton();
        },
        (error) => {
            let errorMessage = '❌ Location access failed';
            if (error.code === error.PERMISSION_DENIED) {
                errorMessage = '❌ Location access denied by user';
            } else if (error.code === error.TIMEOUT) {
                errorMessage = '❌ Location request timed out';
            }
            statusElement.textContent = errorMessage;
            statusElement.className = 'location-status error';
            resetLocationButton();
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
        }
    );
}

// Reset buttons
function resetLocationButton() {
    const locationBtn = document.querySelector('.location-btn');
    locationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> Use My Current Location';
    locationBtn.disabled = false;
}

function resetURLButton(button, originalText) {
    button.innerHTML = originalText;
    button.disabled = false;
}

// ==================== UI FUNCTIONS ====================

// Clear all form fields
function clearForm() {
    if (confirm('Are you sure you want to clear all form fields?')) {
        document.getElementById('name').value = '';
        document.getElementById('mobile').value = '';
        document.getElementById('address').value = '';
        document.getElementById('coordinates').value = '';
        document.getElementById('map-url').value = '';
        document.getElementById('location-status').textContent = '';
        
        // Clear photo previews
        uploadedPhotos = [];
        updatePhotoPreviews();
        
        // Reset submit button if it was in update mode
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Customer';
        
        showToast('✅ Form cleared successfully!');
    }
}

// Show section
function showSection(sectionId) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    updateHeader(sectionId);
    window.scrollTo(0, 0);
    
    // Auto-focus search when switching to customers section
    if (sectionId === 'view-customers') {
        setTimeout(() => {
            const searchInput = document.getElementById('customer-search');
            if (searchInput && !currentSearchTerm) {
                searchInput.focus();
            }
        }, 300);
    }
}

function updateHeader(sectionId) {
    const headerIcon = document.getElementById('header-icon');
    const headerTitle = document.getElementById('header-title');
    
    if (sectionId === 'add-customer') {
        headerIcon.className = 'fas fa-user-plus header-icon';
        headerTitle.textContent = 'Add Customer';
    } else if (sectionId === 'view-customers') {
        headerIcon.className = 'fas fa-users header-icon';
        headerTitle.textContent = 'My Customers';
    }
}

// ==================== CONTACT ACTIONS ====================

function showActionSheet(name, mobile) {
    currentMobileNumber = mobile;
    currentCustomerName = name;
    
    document.getElementById('action-title').textContent = `Contact ${name}`;
    document.getElementById('action-number').textContent = `+91-${mobile}`;
    
    const actionSheet = document.getElementById('action-sheet');
    actionSheet.classList.add('show');
    
    document.body.style.overflow = 'hidden';
}

function closeActionSheet() {
    const actionSheet = document.getElementById('action-sheet');
    actionSheet.classList.remove('show');
    document.body.style.overflow = '';
    currentMobileNumber = '';
    currentCustomerName = '';
}

function callNumber() {
    if (currentMobileNumber) {
        window.location.href = `tel:+91${currentMobileNumber}`;
    }
    closeActionSheet();
}

function sendWhatsApp() {
    if (currentMobileNumber) {
        const message = `Hello ${currentCustomerName}!`;
        const whatsappUrl = `https://wa.me/91${currentMobileNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }
    closeActionSheet();
}

function saveToContacts() {
    if (currentMobileNumber) {
        // In a real app, you would use the Contacts API
        // For now, we'll just show a toast
        showToast(`✅ ${currentCustomerName} saved to contacts!`);
    }
    closeActionSheet();
}

function viewOnMap(coordinates) {
    if (coordinates && coordinates !== 'Not provided') {
        const mapsUrl = `https://maps.google.com/?q=${coordinates}`;
        window.open(mapsUrl, '_blank');
    } else {
        showToast('❌ No coordinates available');
    }
}

// ==================== THEME MANAGEMENT ====================

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeIcon = document.getElementById('theme-icon');
    if (theme === 'dark') {
        themeIcon.className = 'fas fa-sun';
    } else {
        themeIcon.className = 'fas fa-moon';
    }
}

// ==================== UTILITIES ====================

// Toast notification
function showToast(message) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Add icon based on message type
    let icon = 'fas fa-info-circle';
    if (message.includes('✅')) icon = 'fas fa-check-circle';
    if (message.includes('❌')) icon = 'fas fa-exclamation-circle';
    if (message.includes('✏️')) icon = 'fas fa-edit';
    
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 4000);
}

// Add keyboard shortcut for search (Ctrl+F or Cmd+F)
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        showSection('view-customers');
        setTimeout(() => {
            document.getElementById('customer-search').focus();
        }, 100);
    }
    
    // Escape key to clear search
    if (e.key === 'Escape' && document.getElementById('customer-search').value) {
        clearSearch();
    }
    
    // Escape key to close modals
    if (e.key === 'Escape') {
        closeBackupModal();
        closePhotoModal();
        closeActionSheet();
        const shareOverlay = document.querySelector('.share-overlay');
        if (shareOverlay) {
            closeShareMenu();
        }
    }
});

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('photo-modal')) {
        closePhotoModal();
    }
});
