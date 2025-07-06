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

// Venue status (open/closed) - Enhanced with date-based status
let venueStatus = {
    'Field 1': { open: true, closedDates: [] },
    'Field 2': { open: true, closedDates: [] },
    'Field 3': { open: true, closedDates: [] },
    'Field 4': { open: true, closedDates: [] },
    'Field 5': { open: true, closedDates: [] },
    'Field 6': { open: true, closedDates: [] },
    'Field 7': { open: true, closedDates: [] },
    'Field 8': { open: true, closedDates: [] },
    'Field 9': { open: true, closedDates: [] }
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

// Time management variables
let timeCheckInterval = null;
let isTimeManagementActive = true;
let timeOffset = 0; // Time offset in minutes for testing

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

// ===== TIME MANAGEMENT FUNCTIONS =====

// Function to parse time string (HH:MM) to minutes since midnight
function parseTimeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Function to get current time in minutes since midnight (with offset)
function getCurrentTimeInMinutes() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + timeOffset);
    return now.getHours() * 60 + now.getMinutes();
}

// Function to get adjusted current time
function getAdjustedTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + timeOffset);
    return now;
}

// Function to adjust time offset
function adjustTimeOffset(minutes) {
    timeOffset += minutes;
    manageCellStatesByTime();
    updateTimeDisplay();
    showTimeCheckNotification(`Time adjusted by ${minutes} minutes. Current offset: ${timeOffset} minutes`);
}

// Function to reset time to actual time
function resetTimeOffset() {
    timeOffset = 0;
    manageCellStatesByTime();
    updateTimeDisplay();
    showTimeCheckNotification('Time reset to actual system time');
}

// Update time display with offset indicator
function updateTimeDisplay() {
    const adjustedTime = getAdjustedTime();
    const timeStr = adjustedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const offsetDisplay = document.getElementById('timeOffsetDisplay');
    if (offsetDisplay) {
        if (timeOffset !== 0) {
            const sign = timeOffset > 0 ? '+' : '';
            offsetDisplay.textContent = `Testing Time: ${timeStr} (${sign}${timeOffset} min)`;
            offsetDisplay.style.display = 'block';
        } else {
            offsetDisplay.textContent = '';
            offsetDisplay.style.display = 'none';
        }
    }
}

// Main function to manage cell states based on time
function manageCellStatesByTime() {
    if (!isTimeManagementActive) return;
    
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    const currentMinutes = getCurrentTimeInMinutes();
    const rows = tableBody.getElementsByTagName('tr');
    
    for (let row of rows) {
        // Get the time from the first cell (time column)
        const timeCell = row.cells[0];
        if (!timeCell) continue;
        
        const timeSlot = timeCell.textContent.trim();
        const slotMinutes = parseTimeToMinutes(timeSlot);
        
        // Determine if this time slot has passed
        const isPassed = currentMinutes >= slotMinutes;
        
        // Apply styling to the time cell itself
        if (isPassed) {
            timeCell.classList.add('time-passed');
        } else {
            timeCell.classList.remove('time-passed');
        }
        
        // Process all venue cells in this row (skip first cell which is time)
        for (let i = 1; i < row.cells.length; i++) {
            const cell = row.cells[i];
            const cellContent = cell.querySelector('.cell-content');
            
            if (cellContent) {
                if (isPassed) {
                    freezeCell(cellContent, cell);
                } else {
                    unfreezeCell(cellContent, cell);
                }
            }
        }
    }
    
    // Update time check status display
    updateTimeCheckStatus();
}

// Function to freeze/disable a cell
function freezeCell(cellContent, cell) {
    // Add frozen class for styling
    cellContent.classList.add('time-frozen');
    
    // Disable click events
    const originalOnclick = cellContent.onclick;
    cellContent.setAttribute('data-original-onclick', 'true');
    cellContent.onclick = null;
    cellContent.style.cursor = 'not-allowed';
    
    // Disable any cancel buttons in the cell
    const cancelBtn = cellContent.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.classList.add('disabled');
        cancelBtn.disabled = true;
    }
    
    // Add a "PAST" indicator if it doesn't exist
    if (!cellContent.querySelector('.past-indicator')) {
        const pastIndicator = document.createElement('div');
        pastIndicator.className = 'past-indicator';
        pastIndicator.textContent = 'PAST';
        cellContent.appendChild(pastIndicator);
    }
}

// Function to unfreeze/enable a cell
function unfreezeCell(cellContent, cell) {
    // Remove frozen class
    cellContent.classList.remove('time-frozen');
    
    // Re-enable click events if appropriate
    const isVenueClosed = cellContent.classList.contains('venue-closed');
    const isFull = cellContent.classList.contains('full-cell');
    const isUserBooked = cellContent.classList.contains('user-booked-cell');
    
    if (!isVenueClosed && !isFull && !isUserBooked) {
        cellContent.style.cursor = 'pointer';
        // Restore the original onclick if it was removed
        if (cellContent.getAttribute('data-original-onclick')) {
            const venue = venues[cell.cellIndex - 1]; // -1 because first column is time
            const time = cell.parentElement.cells[0].textContent.trim();
            cellContent.onclick = () => bookSlot(venue, time);
            cellContent.removeAttribute('data-original-onclick');
        }
    }
    
    // Re-enable cancel buttons
    const cancelBtn = cellContent.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.classList.remove('disabled');
        cancelBtn.disabled = false;
    }
    
    // Remove "Past" indicator
    const pastIndicator = cellContent.querySelector('.past-indicator');
    if (pastIndicator) {
        pastIndicator.remove();
    }
}

// Toggle time management on/off
function toggleTimeManagement() {
    isTimeManagementActive = !isTimeManagementActive;
    const toggleBtn = document.getElementById('toggleTimeManagementBtn');
    
    if (isTimeManagementActive) {
        toggleBtn.textContent = '⏸️ Pause Time Check';
        toggleBtn.classList.remove('paused');
        manageCellStatesByTime();
    } else {
        toggleBtn.textContent = '▶️ Resume Time Check';
        toggleBtn.classList.add('paused');
        // Clear all time-based freezing when paused
        const tableBody = document.getElementById('tableBody');
        if (tableBody) {
            const cellContents = tableBody.querySelectorAll('.cell-content.time-frozen');
            cellContents.forEach(cellContent => {
                unfreezeCell(cellContent, cellContent.parentElement);
            });
        }
    }
    
    updateTimeCheckStatus();
}

// Update time check status display
function updateTimeCheckStatus() {
    const statusDisplay = document.getElementById('timeCheckStatus');
    if (statusDisplay) {
        const adjustedTime = getAdjustedTime();
        const timeStr = adjustedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        statusDisplay.textContent = isTimeManagementActive ? 
            `Time check active (${timeStr})` : 
            'Time check paused';
        statusDisplay.className = isTimeManagementActive ? 'time-check-active' : 'time-check-paused';
    }
}

// Show notification
function showTimeCheckNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'time-check-notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize time management
function initializeTimeManagement() {
    // Perform initial check
    manageCellStatesByTime();
    
    // Set up automatic checks every minute
    if (timeCheckInterval) {
        clearInterval(timeCheckInterval);
    }
    timeCheckInterval = setInterval(manageCellStatesByTime, 60000);
    
    // Add time management controls if they don't exist
    addTimeManagementControls();
}

// Add time management controls to the interface
function addTimeManagementControls() {
    const userSection = document.querySelector('#mainApp .user-section');
    if (userSection && !document.getElementById('timeControlsContainer')) {
        // Create a container for time controls
        const timeControlsContainer = document.createElement('div');
        timeControlsContainer.id = 'timeControlsContainer';
        timeControlsContainer.className = 'time-controls-container';
        
        // Add time adjustment controls
        const timeAdjustContainer = document.createElement('div');
        timeAdjustContainer.className = 'time-adjust-container';
        
        const adjustLabel = document.createElement('span');
        adjustLabel.className = 'time-adjust-label';
        adjustLabel.textContent = 'Test Time:';
        
        const minusHourBtn = document.createElement('button');
        minusHourBtn.className = 'time-adjust-btn';
        minusHourBtn.textContent = '-1h';
        minusHourBtn.onclick = () => adjustTimeOffset(-60);
        
        const minusMinBtn = document.createElement('button');
        minusMinBtn.className = 'time-adjust-btn';
        minusMinBtn.textContent = '-10m';
        minusMinBtn.onclick = () => adjustTimeOffset(-10);
        
        const resetBtn = document.createElement('button');
        resetBtn.className = 'time-adjust-btn reset';
        resetBtn.textContent = 'Reset';
        resetBtn.onclick = resetTimeOffset;
        
        const plusMinBtn = document.createElement('button');
        plusMinBtn.className = 'time-adjust-btn';
        plusMinBtn.textContent = '+10m';
        plusMinBtn.onclick = () => adjustTimeOffset(10);
        
        const plusHourBtn = document.createElement('button');
        plusHourBtn.className = 'time-adjust-btn';
        plusHourBtn.textContent = '+1h';
        plusHourBtn.onclick = () => adjustTimeOffset(60);
        
        timeAdjustContainer.appendChild(adjustLabel);
        timeAdjustContainer.appendChild(minusHourBtn);
        timeAdjustContainer.appendChild(minusMinBtn);
        timeAdjustContainer.appendChild(resetBtn);
        timeAdjustContainer.appendChild(plusMinBtn);
        timeAdjustContainer.appendChild(plusHourBtn);
        
        // Add toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'toggleTimeManagementBtn';
        toggleBtn.className = 'time-control-btn';
        toggleBtn.textContent = '⏸️ Pause Time Check';
        toggleBtn.onclick = toggleTimeManagement;
        
        // Add status display
        const statusDisplay = document.createElement('div');
        statusDisplay.id = 'timeCheckStatus';
        statusDisplay.className = 'time-check-active';
        
        // Add offset display
        const offsetDisplay = document.createElement('div');
        offsetDisplay.id = 'timeOffsetDisplay';
        offsetDisplay.className = 'time-offset-display';
        
        timeControlsContainer.appendChild(timeAdjustContainer);
        timeControlsContainer.appendChild(toggleBtn);
        timeControlsContainer.appendChild(statusDisplay);
        timeControlsContainer.appendChild(offsetDisplay);
        
        // Insert before the logout button
        const logoutBtn = userSection.querySelector('.logout-btn');
        userSection.insertBefore(timeControlsContainer, logoutBtn);
    }
}

// ===== END TIME MANAGEMENT FUNCTIONS =====

// Check if venue is open on a specific date
function isVenueOpenOnDate(venue, date) {
    const venueInfo = venueStatus[venue];
    if (!venueInfo.open) return false;
    
    const dateStr = date.toDateString();
    return !venueInfo.closedDates.includes(dateStr);
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
    
    // Clear time check interval
    if (timeCheckInterval) {
        clearInterval(timeCheckInterval);
        timeCheckInterval = null;
    }
    
    // Reset time offset
    timeOffset = 0;
    
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

// Venue Management - Enhanced
function loadVenueStatus() {
    console.log('Loading venue status'); // Debug log
    const container = document.getElementById('venueStatusContainer');
    
    if (!container) {
        console.error('venueStatusContainer not found!');
        return;
    }
    
    container.innerHTML = '';
    
    venues.forEach(venue => {
        const venueInfo = venueStatus[venue];
        const venueDiv = document.createElement('div');
        venueDiv.className = 'venue-status-item enhanced';
        
        const today = new Date().toDateString();
        const isOpenToday = venueInfo.open && !venueInfo.closedDates.includes(today);
        
        venueDiv.innerHTML = `
            <div class="venue-header">
                <span class="venue-name">${venue}</span>
                <div class="venue-quick-status ${isOpenToday ? 'open' : 'closed'}">
                    ${isOpenToday ? 'Open Today' : 'Closed Today'}
                </div>
            </div>
            <div class="venue-controls">
                <div class="permanent-status">
                    <label class="switch">
                        <input type="checkbox" ${venueInfo.open ? 'checked' : ''} 
                               onchange="toggleVenuePermanent('${venue}')">
                        <span class="slider"></span>
                    </label>
                    <span class="status-label">Permanently ${venueInfo.open ? 'Open' : 'Closed'}</span>
                </div>
                <div class="date-controls">
                    <button class="date-btn" onclick="showVenueDateManager('${venue}')">
                        📅 Manage Dates (${venueInfo.closedDates.length} closed)
                    </button>
                </div>
            </div>
        `;
        container.appendChild(venueDiv);
    });
    
    console.log('Venue status loaded'); // Debug log
}

function toggleVenuePermanent(venue) {
    venueStatus[venue].open = !venueStatus[venue].open;
    loadVenueStatus();
}

function showVenueDateManager(venue) {
    const venueInfo = venueStatus[venue];
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'date-manager-overlay';
    modal.innerHTML = `
        <div class="date-manager-modal">
            <div class="date-manager-header">
                <h3>📅 Manage Closed Dates - ${venue}</h3>
                <button class="close-btn" onclick="closeDateManager()">✕</button>
            </div>
            <div class="date-manager-content">
                <div class="add-date-section">
                    <label>Add Closed Date:</label>
                    <input type="date" id="newClosedDate" min="${new Date().toISOString().split('T')[0]}">
                    <button class="add-date-btn" onclick="addClosedDate('${venue}')">Add Date</button>
                </div>
                <div class="closed-dates-list">
                    <h4>Closed Dates:</h4>
                    ${venueInfo.closedDates.length === 0 ? 
                        '<p class="no-dates">No specific closed dates</p>' :
                        venueInfo.closedDates.map(dateStr => `
                            <div class="closed-date-item">
                                <span>${new Date(dateStr).toLocaleDateString()}</span>
                                <button class="remove-date-btn" onclick="removeClosedDate('${venue}', '${dateStr}')">Remove</button>
                            </div>
                        `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeDateManager() {
    const modal = document.querySelector('.date-manager-overlay');
    if (modal) modal.remove();
}

function addClosedDate(venue) {
    const dateInput = document.getElementById('newClosedDate');
    if (dateInput.value) {
        const date = new Date(dateInput.value);
        const dateStr = date.toDateString();
        
        if (!venueStatus[venue].closedDates.includes(dateStr)) {
            venueStatus[venue].closedDates.push(dateStr);
            // Clear bookings for this venue on this date
            timeSlots.forEach(time => {
                bookingData[venue][time] = [];
            });
            loadVenueStatus();
            closeDateManager();
            showVenueDateManager(venue); // Reopen with updated list
        } else {
            alert('This date is already in the closed dates list.');
        }
    }
}

function removeClosedDate(venue, dateStr) {
    const index = venueStatus[venue].closedDates.indexOf(dateStr);
    if (index > -1) {
        venueStatus[venue].closedDates.splice(index, 1);
        loadVenueStatus();
        closeDateManager();
        showVenueDateManager(venue); // Reopen with updated list
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
    closeDateManager();
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
    const now = getAdjustedTime(); // Use adjusted time
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const dateStr = now.toLocaleDateString(undefined, dateOptions);
    const timeStr = now.toLocaleTimeString(undefined, timeOptions);
    document.getElementById('currentTime').textContent = `${dateStr} ${timeStr}`;
}

// Initialize the application
function initializeApp() {
    initializeBookingData();
    addSampleBookings(); // Make sure sample bookings are loaded first
    populateFilters();
    generateTable();
    updateCurrentTime(); // Initial call
    setInterval(updateCurrentTime, 1000); // Update every second
    
    // Initialize time management
    initializeTimeManagement();
    
    console.log('App initialized with sample bookings and time management'); // Debug log
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

    // If "Filter Upcoming Available" is active, adjust filteredTimes (no time logic, just show all)
    if (document.getElementById('venueFilter').dataset.filterUpcoming === 'true') {
        // Just filter to show available slots (not full and venue open)
        filteredTimes = filteredTimes.filter(time => {
            return filteredVenues.some(venue => {
                const isVenueOpen = isVenueOpenOnDate(venue, new Date());
                const currentBookings = bookingData[venue][time].length;
                const capacity = venueCapacities[venue];
                const isNotFull = currentBookings < capacity;
                return isVenueOpen && isNotFull;
            });
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
    
    // Apply time management after table is generated
    setTimeout(manageCellStatesByTime, 100);
}

// Create cell content
function createCellContent(venue, time) {
    const cellDiv = document.createElement('div');
    cellDiv.className = 'cell-content';
    
    // Check if venue is closed today
    const today = new Date();
    const isOpenToday = isVenueOpenOnDate(venue, today);
    
    if (!isOpenToday) {
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
    if (isUserBooked) {
        cellDiv.classList.add('user-booked-cell');
    } else if (isFull) {
        cellDiv.classList.add('full-cell');
    } else if (booked > 0) {
        cellDiv.classList.add('booked-cell');
    }
    
    // Click handler for booking
    if (!isFull && !isUserBooked) {
        cellDiv.onclick = () => bookSlot(venue, time);
    }
    
    return cellDiv;
}

// Book a slot
function bookSlot(venue, time) {
    // Check if venue is closed today
    if (!isVenueOpenOnDate(venue, new Date())) {
        alert('This venue is currently closed.');
        return;
    }
    
    // Check if time has passed
    const currentMinutes = getCurrentTimeInMinutes();
    const slotMinutes = parseTimeToMinutes(time);
    if (currentMinutes >= slotMinutes && isTimeManagementActive) {
        alert('Cannot book a time slot that has already passed.');
        return;
    }
    
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
        
        // Check if time has passed
        const currentMinutes = getCurrentTimeInMinutes();
        const slotMinutes = parseTimeToMinutes(time);
        if (currentMinutes >= slotMinutes && isTimeManagementActive) {
            alert('Cannot cancel a booking for a time slot that has already passed.');
            return;
        }
        
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
    const venueFilter = document.getElementById('venueFilter');
    venueFilter.dataset.filterUpcoming = 'false'; // Reset upcoming filter
    
    // Reset button text and style
    const filterBtn = document.querySelector('.filter-btn');
    filterBtn.textContent = 'Filter Upcoming Available';
    filterBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    
    generateTable();
}

// Filter upcoming available cells
function filterUpcoming() {
    const venueFilter = document.getElementById('venueFilter');
    const isCurrentlyFiltered = venueFilter.dataset.filterUpcoming === 'true';
    
    if (isCurrentlyFiltered) {
        // Toggle off - reset filters
        venueFilter.dataset.filterUpcoming = 'false';
        venueFilter.value = ""; // Clear venue filter
        document.getElementById('timeFilter').value = ""; // Clear time filter
        
        // Update button text to show it's not active
        const filterBtn = document.querySelector('.filter-btn');
        filterBtn.textContent = 'Filter Upcoming Available';
        filterBtn.style.background = 'rgba(255, 255, 255, 0.3)';
    } else {
        // Toggle on - apply upcoming filter
        venueFilter.dataset.filterUpcoming = 'true';
        venueFilter.value = ""; // Clear venue filter
        document.getElementById('timeFilter').value = ""; // Clear time filter
        
        // Update button text to show it's active
        const filterBtn = document.querySelector('.filter-btn');
        filterBtn.textContent = 'Clear Upcoming Filter';
        filterBtn.style.background = 'rgba(255, 255, 255, 0.5)';
    }
    
    generateTable();
}

// Add some sample bookings for demonstration
function addSampleBookings() {
    // Add some random bookings with skill levels - including the specific one you requested
    bookingData['Field 1']['19:00'] = ['John', 'Alice'];
    bookingData['Field 2']['19:20'] = ['Bob', 'Carol', 'Dave'];
    bookingData['Field 2']['23:00'] = ['Bob', 'Carol', 'Dave']; // Specific booking you requested
    bookingData['Field 3']['20:00'] = ['Eve', 'Frank'];
    bookingData['Field 5']['23:00'] = ['Grace', 'Henry', 'Ivy', 'Jack']; // Changed from 21:00 to 23:00
    bookingData['Field 7']['22:00'] = ['Kate', 'Liam'];
    bookingData['Field 4']['20:40'] = ['Sarah', 'Mike']; // Additional sample booking
    bookingData['Field 6']['21:40'] = ['Tom']; // Additional sample booking
    
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
    userSkillLevels['Sarah'] = 'advanced';
    userSkillLevels['Mike'] = 'beginner';
    userSkillLevels['Tom'] = 'advanced';
    
    console.log('Sample bookings loaded:', bookingData); // Debug log
    console.log('User skill levels loaded:', userSkillLevels); // Debug log
}

// Handle escape key to close modals
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeMessageBoard();
        closeAdminMessageBoard();
        closeQRCode();
        closeDateManager();
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

// Export functions for external use or testing
window.timeManagement = {
    manageCellStatesByTime,
    adjustTimeOffset,
    resetTimeOffset,
    toggleTimeManagement,
    freezeCell,
    unfreezeCell,
    parseTimeToMinutes,
    getCurrentTimeInMinutes,
    getAdjustedTime,
    isTimeManagementActive: () => isTimeManagementActive,
    getTimeOffset: () => timeOffset
};
