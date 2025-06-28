// Data structure
const venues = ['Field 1', 'Field 2', 'Field 3', 'Field 4', 'Field 5', 'Field 6', 'Field 7', 'Field 8', 'Field 9'];
const timeSlots = ['19:00', '19:20', '19:40', '20:00', '20:20', '20:40', '21:00', '21:20', '21:40', '22:00', '22:20', '22:40', '23:00'];

// Venue capacities
const venueCapacities = {
    'Field 1': 4,
    'Field 2': 4,
    'Field 3': 4,
    'Field 4': 4,
    'Field 5': 4,
    'Field 6': 4,
    'Field 7': 2,
    'Field 8': 2,
    'Field 9': 2
};

// Venue status (open/closed)
let venueStatus = {
    'Field 1': true,
    'Field 2': true,
    'Field 3': true,
    'Field 4': true,
    'Field 5': true,
    'Field 6': true,
    'Field 7': true,
    'Field 8': true,
    'Field 9': true
};

// User membership data
let userMembership = {
    'Official Member A': { type: 'official', expiry: new Date(2025, 11, 31) }, // End of this year
    'Temporary Member A': { type: 'temporary', expiry: new Date() } // End of today
};

// Set temporary member expiry to end of today
userMembership['Temporary Member A'].expiry.setHours(23, 59, 59, 999);

// Booking data: venue -> time -> [users]
let bookingData = {};
let currentUser = '';
let currentUserSkillLevel = 'beginner'; // Default to beginner
let userBooking = null; // {venue: '', time: ''}
let isAdmin = false;

// User skill levels storage
let userSkillLevels = {};

// Message board data
let messages = [
    {
        id: 1,
        author: 'System Admin',
        text: 'Welcome to the new system!!',
        date: new Date().toLocaleDateString(),
        timestamp: new Date()
    }
];

// Function to get user initials
function getUserInitials(username) {
    if (!username) return '';
    
    const words = username.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    } else {
        return words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
    }
}

// Initialize booking data
function initializeBookingData() {
    venues.forEach(venue => {
        bookingData[venue] = {};
        timeSlots.forEach(time => {
            bookingData[venue][time] = [];
        });
    });
}

// Login function
function login() {
    const userId = document.getElementById('userIdInput').value.trim();
    const adminCheck = document.getElementById('adminCheck').checked;
    const skillLevel = document.querySelector('input[name="skillLevel"]:checked').value;
    
    if (userId) {
        currentUser = userId;
        currentUserSkillLevel = skillLevel;
        isAdmin = adminCheck;
        
        // Store user's skill level
        userSkillLevels[userId] = skillLevel;
        
        console.log('Admin check:', adminCheck); // Debug log
        console.log('User ID:', userId); // Debug log
        console.log('Skill Level:', skillLevel); // Debug log
        
        if (isAdmin) {
            console.log('Switching to admin interface'); // Debug log
            
            // Update admin display
            const adminUserDisplay = document.getElementById('adminUserDisplay');
            if (adminUserDisplay) {
                adminUserDisplay.textContent = `Administrator: ${userId}`;
            }
            
            // Hide login form and show admin app
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('mainApp').style.display = 'none';
            document.getElementById('adminApp').style.display = 'block';
            
            // Initialize admin app
            initializeAdminApp();
        } else {
            console.log('Switching to user interface'); // Debug log
            
            const skillText = skillLevel === 'beginner' ? 'Beginner' : 'Advanced';
            const skillColor = skillLevel === 'beginner' ? '🟢' : '🔴';
            document.getElementById('userDisplay').textContent = `User: ${userId} ${skillColor} ${skillText}`;
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            document.getElementById('adminApp').style.display = 'none';
            initializeApp();
        }
    } else {
        alert('Please enter a valid User ID');
    }
}

// Logout function
function logout() {
    currentUser = '';
    currentUserSkillLevel = 'beginner';
    userBooking = null;
    isAdmin = false;
    document.getElementById('userIdInput').value = '';
    document.getElementById('adminCheck').checked = false;
    
    // Reset skill level selection to beginner
    document.querySelector('input[name="skillLevel"][value="beginner"]').checked = true;
    
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('adminApp').style.display = 'none';
    closeMessageBoard();
    closeAdminModals();
}

// Admin App Functions
function initializeAdminApp() {
    console.log('Initializing admin app'); // Debug log
    
    // Make sure booking data is initialized
    initializeBookingData();
    
    // Load admin-specific content
    loadVenueStatus();
    loadUserMembership();
    updateAdminCurrentTime();
    setInterval(updateAdminCurrentTime, 1000);
    
    console.log('Admin app initialized'); // Debug log
}

function updateAdminCurrentTime() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const dateStr = now.toLocaleDateString(undefined, dateOptions);
    const timeStr = now.toLocaleTimeString(undefined, timeOptions);
    
    const adminCurrentTimeElement = document.getElementById('adminCurrentTime');
    if (adminCurrentTimeElement) {
        adminCurrentTimeElement.textContent = `${dateStr} ${timeStr}`;
    }
}

// Venue Management
function loadVenueStatus() {
    console.log('Loading venue status'); // Debug log
    const container = document.getElementById('venueStatusContainer');
    
    if (!container) {
        console.error('venueStatusContainer not found!');
        return;
    }
    
    container.innerHTML = '';
    
    venues.forEach(venue => {
        const venueDiv = document.createElement('div');
        venueDiv.className = 'venue-status-item';
        venueDiv.innerHTML = `
            <span class="venue-name">${venue}</span>
            <label class="switch">
                <input type="checkbox" ${venueStatus[venue] ? 'checked' : ''} 
                       onchange="toggleVenue('${venue}')">
                <span class="slider"></span>
            </label>
            <span class="status-text">${venueStatus[venue] ? 'Open' : 'Closed'}</span>
        `;
        container.appendChild(venueDiv);
    });
    
    console.log('Venue status loaded'); // Debug log
}

function toggleVenue(venue) {
    venueStatus[venue] = !venueStatus[venue];
    loadVenueStatus();
    // Clear bookings for closed venues
    if (!venueStatus[venue]) {
        timeSlots.forEach(time => {
            bookingData[venue][time] = [];
        });
    }
}

// User Membership Management
function loadUserMembership() {
    console.log('Loading user membership'); // Debug log
    const container = document.getElementById('userMembershipContainer');
    
    if (!container) {
        console.error('userMembershipContainer not found!');
        return;
    }
    
    container.innerHTML = '';
    
    Object.entries(userMembership).forEach(([username, data]) => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-membership-item';
        
        const now = new Date();
        const isExpired = data.expiry < now;
        const timeLeft = data.expiry - now;
        const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
        
        userDiv.innerHTML = `
            <div class="user-info">
                <span class="username">${username}</span>
                <span class="membership-type ${data.type}">${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Member</span>
            </div>
            <div class="expiry-info ${isExpired ? 'expired' : ''}">
                <span class="expiry-date">Expires: ${data.expiry.toLocaleDateString()}</span>
                <span class="time-left">${isExpired ? 'EXPIRED' : daysLeft > 0 ? `${daysLeft} days left` : 'Expires today'}</span>
            </div>
            <div class="user-actions">
                <button onclick="editUserMembership('${username}')" class="edit-btn">Edit</button>
                <button onclick="deleteUser('${username}')" class="delete-btn">Delete</button>
            </div>
        `;
        container.appendChild(userDiv);
    });
    
    console.log('User membership loaded'); // Debug log
}

function editUserMembership(username) {
    const user = userMembership[username];
    if (!user) return;
    
    const newExpiry = prompt(`Edit expiry date for ${username} (YYYY-MM-DD):`, 
                            user.expiry.toISOString().split('T')[0]);
    if (newExpiry) {
        userMembership[username].expiry = new Date(newExpiry);
        loadUserMembership();
    }
}

function deleteUser(username) {
    if (confirm(`Are you sure you want to delete ${username}?`)) {
        delete userMembership[username];
        loadUserMembership();
    }
}

function addNewUser() {
    const username = prompt('Enter username:');
    if (!username) return;
    
    const type = prompt('Enter membership type (official/temporary):');
    if (type !== 'official' && type !== 'temporary') {
        alert('Invalid membership type');
        return;
    }
    
    const expiry = prompt('Enter expiry date (YYYY-MM-DD):');
    if (!expiry) return;
    
    userMembership[username] = {
        type: type,
        expiry: new Date(expiry)
    };
    loadUserMembership();
}

// Message Board Management for Admin
function showAdminMessageBoard() {
    document.getElementById('adminMessageBoardOverlay').style.display = 'block';
    loadAdminMessages();
}

function closeAdminMessageBoard() {
    document.getElementById('adminMessageBoardOverlay').style.display = 'none';
}

function loadAdminMessages() {
    const content = document.getElementById('adminMessageBoardContent');
    
    if (messages.length === 0) {
        content.innerHTML = '<div class="no-messages">No messages available.</div>';
        return;
    }

    const sortedMessages = [...messages].sort((a, b) => b.timestamp - a.timestamp);
    
    content.innerHTML = sortedMessages.map(message => `
        <div class="admin-message-item">
            <div class="message-header">
                <span class="message-author">${message.author}</span>
                <span class="message-date">${message.date}</span>
                <button onclick="editMessage(${message.id})" class="edit-msg-btn">Edit</button>
                <button onclick="deleteMessage(${message.id})" class="delete-msg-btn">Delete</button>
            </div>
            <div class="message-text">${message.text}</div>
        </div>
    `).join('');
}

function addNewMessage() {
    const text = prompt('Enter message text:');
    if (text) {
        const newMessage = {
            id: Date.now(),
            author: currentUser,
            text: text,
            date: new Date().toLocaleDateString(),
            timestamp: new Date()
        };
        messages.push(newMessage);
        loadAdminMessages();
    }
}

function editMessage(id) {
    const message = messages.find(m => m.id === id);
    if (message) {
        const newText = prompt('Edit message:', message.text);
        if (newText !== null) {
            message.text = newText;
            loadAdminMessages();
        }
    }
}

function deleteMessage(id) {
    if (confirm('Are you sure you want to delete this message?')) {
        const index = messages.findIndex(m => m.id === id);
        if (index > -1) {
            messages.splice(index, 1);
            loadAdminMessages();
        }
    }
}

// QR Code Generation
function showQRCode() {
    const registrationForm = `
Registration Form
================
Name: _______________
Email: ______________
Membership Type: [ ] Official [ ] Temporary
Date: ${new Date().toLocaleDateString()}

Please submit this form to the administrator.
Contact: admin@venue.com
    `;
    
    // Create QR code URL (using a free QR code API)
    const qrData = encodeURIComponent(registrationForm);
    const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}`;
    
    document.getElementById('qrCodeImage').src = qrCodeURL;
    document.getElementById('qrCodeOverlay').style.display = 'block';
}

function closeQRCode() {
    document.getElementById('qrCodeOverlay').style.display = 'none';
}

function closeAdminModals() {
    closeAdminMessageBoard();
    closeQRCode();
}

// Message Board Functions
function toggleMessageBoard() {
    const overlay = document.getElementById('messageBoardOverlay');
    if (overlay.style.display === 'none' || overlay.style.display === '') {
        showMessageBoard();
    } else {
        closeMessageBoard();
    }
}

function showMessageBoard() {
    document.getElementById('messageBoardOverlay').style.display = 'block';
    loadMessages();
}

function closeMessageBoard() {
    document.getElementById('messageBoardOverlay').style.display = 'none';
}

function loadMessages() {
    const content = document.getElementById('messageBoardContent');
    
    if (messages.length === 0) {
        content.innerHTML = '<div class="no-messages">No messages available.</div>';
        return;
    }

    // Sort messages by timestamp (newest first)
    const sortedMessages = [...messages].sort((a, b) => b.timestamp - a.timestamp);
    
    content.innerHTML = sortedMessages.map(message => `
        <div class="message-item">
            <div class="message-header">
                <span class="message-author">${message.author}</span>
                <span class="message-date">${message.date}</span>
            </div>
            <div class="message-text">${message.text}</div>
        </div>
    `).join('');
}

// Function to display current time
function updateCurrentTime() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const dateStr = now.toLocaleDateString(undefined, dateOptions);
    const timeStr = now.toLocaleTimeString(undefined, timeOptions);
    document.getElementById('currentTime').textContent = `${dateStr} ${timeStr}`;
}

// Initialize the application
function initializeApp() {
    initializeBookingData();
    populateFilters();
    generateTable();
    updateCurrentTime(); // Initial call
    setInterval(updateCurrentTime, 1000); // Update every second
}

// Populate filter dropdowns
function populateFilters() {
    const venueFilter = document.getElementById('venueFilter');
    const timeFilter = document.getElementById('timeFilter');
    
    // Clear existing options except "All"
    venueFilter.innerHTML = '<option value="">All Fields</option>';
    timeFilter.innerHTML = '<option value="">All Times</option>';
    
    venues.forEach(venue => {
        const option = document.createElement('option');
        option.value = venue;
        option.textContent = venue;
        venueFilter.appendChild(option);
    });
    
    timeSlots.forEach(time => {
        const option = document.createElement('option');
        option.value = time;
        option.textContent = time;
        timeFilter.appendChild(option);
    });
}

// Generate the timetable (switched rows and columns)
function generateTable() {
    const header = document.getElementById('tableHeader');
    const body = document.getElementById('tableBody');
    
    // Clear existing content
    header.innerHTML = '';
    body.innerHTML = '';
    
    // Get filtered data
    const filteredVenues = getFilteredVenues();
    let filteredTimes = getFilteredTimes();

    // If "Filter Upcoming Available" is active, adjust filteredTimes
    if (document.getElementById('venueFilter').dataset.filterUpcoming === 'true') {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        filteredTimes = filteredTimes.filter(time => {
            const [hour, minute] = time.split(':').map(Number);
            const slotMinutes = hour * 60 + minute;
            return slotMinutes >= currentMinutes;
        });
    }

    // Create header (now venues are columns)
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Time / Field</th>';
    filteredVenues.forEach(venue => {
        headerRow.innerHTML += `<th>${venue}</th>`;
    });
    header.appendChild(headerRow);
    
    // Create body rows (now time slots are rows)
    filteredTimes.forEach(time => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${time}</td>`;
        
        filteredVenues.forEach(venue => {
            const cell = document.createElement('td');
            const cellContent = createCellContent(venue, time);
            cell.appendChild(cellContent);
            row.appendChild(cell);
        });
        
        body.appendChild(row);
    });
}

// Create cell content
function createCellContent(venue, time) {
    const cellDiv = document.createElement('div');
    cellDiv.className = 'cell-content';
    
    // Check if venue is closed
    if (!venueStatus[venue]) {
        cellDiv.classList.add('venue-closed');
        cellDiv.innerHTML = '<div class="closed-text">CLOSED</div>';
        cellDiv.style.cursor = 'not-allowed';
        return cellDiv;
    }
    
    const capacity = venueCapacities[venue];
    const booked = bookingData[venue][time].length;
    const bookedUsers = bookingData[venue][time];
    const isUserBooked = userBooking && userBooking.venue === venue && userBooking.time === time;
    const isFull = booked >= capacity;

    const now = new Date();
    const [slotHour, slotMinute] = time.split(':').map(Number);
    const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), slotHour, slotMinute, 0);
    const timeDifference = now.getTime() - slotTime.getTime(); // Difference in milliseconds
    const timeSlotDurationMs = 20 * 60 * 1000; // 20 minutes in milliseconds

    let fillPercentage = 0;
    let isPassedTime = false;

    if (timeDifference > 0) { // If current time is past the slot start time
        isPassedTime = true;
        fillPercentage = Math.min(100, (timeDifference / timeSlotDurationMs) * 100);
        cellDiv.style.setProperty('--fill-percentage', `${fillPercentage}%`);
        cellDiv.classList.add('passed-time-cell');
    }
    
    // Status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'status-indicator';
    if (isFull) {
        statusIndicator.classList.add('full');
    } else if (isUserBooked) {
        statusIndicator.classList.add('user-booked');
    }
    cellDiv.appendChild(statusIndicator);
    
    // Capacity info
    const capacityInfo = document.createElement('div');
    capacityInfo.className = 'capacity-info';
    capacityInfo.textContent = `${booked}/${capacity}`;
    cellDiv.appendChild(capacityInfo);
    
    // User initials display
    if (booked > 0) {
        const initialsContainer = document.createElement('div');
        initialsContainer.className = 'initials-container';
        
        bookedUsers.forEach((user, index) => {
            const initialsCircle = document.createElement('div');
            initialsCircle.className = 'user-initial-circle';
            
            // Get user's skill level and apply appropriate class
            const userSkillLevel = userSkillLevels[user] || 'beginner';
            initialsCircle.classList.add(userSkillLevel);
            
            // Highlight current user's circle
            if (user === currentUser) {
                initialsCircle.classList.add('current-user');
            }
            
            initialsCircle.textContent = getUserInitials(user);
            initialsCircle.title = `${user} (${userSkillLevel === 'beginner' ? 'Beginner' : 'Advanced'})`; // Enhanced tooltip
            
            // Position circles to avoid overlap
            const angle = (index * 360) / Math.max(capacity, booked);
            const radius = 15;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            
            initialsCircle.style.transform = `translate(${x}px, ${y}px)`;
            
            initialsContainer.appendChild(initialsCircle);
        });
        
        cellDiv.appendChild(initialsContainer);
    }
    
    // Participants info
    if (booked > 0) {
        const participants = document.createElement('div');
        participants.className = 'participants';
        participants.textContent = `${booked} participant${booked > 1 ? 's' : ''}`;
        cellDiv.appendChild(participants);
    }
    
    // Cancel button for user's booking
    if (isUserBooked) {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = (e) => {
            e.stopPropagation();
            cancelBooking();
        };
        cellDiv.appendChild(cancelBtn);
    }
    
    // Apply styling based on status
    const cell = cellDiv.parentNode || cellDiv;
    if (isUserBooked) {
        cellDiv.classList.add('user-booked-cell');
    } else if (isFull) {
        cellDiv.classList.add('full-cell');
    } else if (booked > 0) {
        cellDiv.classList.add('booked-cell');
    }
    
    // Click handler for booking
    if (!isFull && !isUserBooked && !isPassedTime) {
        cellDiv.onclick = () => bookSlot(venue, time);
    } else if (isPassedTime) {
        cellDiv.style.cursor = 'not-allowed';
    }
    
    return cellDiv;
}

// Book a slot
function bookSlot(venue, time) {
    if (userBooking) {
        if (confirm('You already have a booking. Cancel current booking to make a new one?')) {
            cancelBooking();
        } else {
            return;
        }
    }
    
    const capacity = venueCapacities[venue];
    const currentBookings = bookingData[venue][time];
    
    if (currentBookings.length < capacity) {
        currentBookings.push(currentUser);
        userBooking = { venue, time };
        generateTable();
        
        // Show success message
        setTimeout(() => {
            alert(`Successfully booked ${venue} at ${time}`);
        }, 100);
    } else {
        alert('This slot is fully booked!');
    }
}

// Cancel booking
function cancelBooking() {
    if (userBooking) {
        const { venue, time } = userBooking;
        const bookings = bookingData[venue][time];
        const userIndex = bookings.indexOf(currentUser);
        
        if (userIndex > -1) {
            bookings.splice(userIndex, 1);
        }
        
        userBooking = null;
        generateTable();
        
        // Show cancellation message
        setTimeout(() => {
            alert(`Booking cancelled for ${venue} at ${time}`);
        }, 100);
    }
}

// Get filtered venues
function getFilteredVenues() {
    const filter = document.getElementById('venueFilter').value;
    return filter ? [filter] : venues;
}

// Get filtered times
function getFilteredTimes() {
    const filter = document.getElementById('timeFilter').value;
    return filter ? [filter] : timeSlots;
}

// Filter table
function filterTable() {
    document.getElementById('venueFilter').dataset.filterUpcoming = 'false'; // Reset upcoming filter
    generateTable();
}

// Filter upcoming available cells
function filterUpcoming() {
    document.getElementById('venueFilter').dataset.filterUpcoming = 'true';
    document.getElementById('venueFilter').value = ""; // Clear venue filter
    document.getElementById('timeFilter').value = ""; // Clear time filter
    generateTable();
}

// Add some sample bookings for demonstration
function addSampleBookings() {
    // Add some random bookings with skill levels
    bookingData['Field 1']['19:00'] = ['John', 'Alice'];
    bookingData['Field 2']['19:20'] = ['Bob', 'Carol', 'Dave'];
    bookingData['Field 3']['20:00'] = ['Eve', 'Frank'];
    bookingData['Field 5']['21:00'] = ['Grace', 'Henry', 'Ivy', 'Jack'];
    bookingData['Field 7']['22:00'] = ['Kate', 'Liam'];
    
    // Set sample skill levels for demonstration
    userSkillLevels['John'] = 'beginner';
    userSkillLevels['Alice'] = 'advanced';
    userSkillLevels['Bob'] = 'beginner';
    userSkillLevels['Carol'] = 'advanced';
    userSkillLevels['Dave'] = 'beginner';
    userSkillLevels['Eve'] = 'advanced';
    userSkillLevels['Frank'] = 'beginner';
    userSkillLevels['Grace'] = 'advanced';
    userSkillLevels['Henry'] = 'beginner';
    userSkillLevels['Ivy'] = 'advanced';
    userSkillLevels['Jack'] = 'beginner';
    userSkillLevels['Kate'] = 'advanced';
    userSkillLevels['Liam'] = 'beginner';
}

// Handle escape key to close modals
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeMessageBoard();
        closeAdminMessageBoard();
        closeQRCode();
    }
});

// Initialize with sample data when page loads
window.addEventListener('load', () => {
    addSampleBookings();
    
    // Test function to ensure all elements exist
    console.log('Page loaded, checking elements:');
    console.log('adminApp exists:', !!document.getElementById('adminApp'));
    console.log('adminUserDisplay exists:', !!document.getElementById('adminUserDisplay'));
    console.log('adminCurrentTime exists:', !!document.getElementById('adminCurrentTime'));
    console.log('venueStatusContainer exists:', !!document.getElementById('venueStatusContainer'));
    console.log('userMembershipContainer exists:', !!document.getElementById('userMembershipContainer'));
});
