// Data structure
let venues = ['Field 1', 'Field 2', 'Field 3', 'Field 4', 'Field 5', 'Field 6', 'Field 7', 'Field 8', 'Field 9'];
let timeSlots = ['19:00', '19:20', '19:40', '20:00', '20:20', '20:40', '21:00', '21:20', '21:40', '22:00', '22:20', '22:40', '23:00'];

// Venue capacities
let venueCapacities = {
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

// Venue status
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
    'Official Member A': { type: 'official', expiry: new Date(2025, 11, 31) },
    'Temporary Member A': { type: 'temporary', expiry: new Date() }
};

// Booking data
let bookingData = {};
let currentUser = '';
let currentUserSkillLevel = 'beginner';
let userBooking = null;
let isAdmin = false;
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
let timeOffset = 0;

// UI Functions
function toggleSection(sectionId) {
    const content = document.getElementById(`${sectionId}-content`);
    const chevron = document.getElementById(`${sectionId}-chevron`);
    
    const isExpanded = content.classList.contains('expanded');
    
    if (isExpanded) {
        content.classList.remove('expanded');
        chevron.classList.remove('expanded');
    } else {
        content.classList.add('expanded');
        chevron.classList.add('expanded');
    }
}

function changeSkillLevel() {
    const skillLevel = document.querySelector('input[name="skillLevel"]:checked').value;
    currentUserSkillLevel = skillLevel;
    userSkillLevels[currentUser] = skillLevel;
    updateUserDisplay();
    generateTable();
}

function updateUserDisplay() {
    const skillText = currentUserSkillLevel === 'beginner' ? 'Beginner' : 'Advanced';
    const skillColor = currentUserSkillLevel === 'beginner' ? '🟢' : '🔴';
    document.getElementById('userDisplay').textContent = `User: ${currentUser} ${skillColor} ${skillText}`;
}

// Time Management Functions
function parseTimeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function getCurrentTimeInMinutes() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + timeOffset);
    return now.getHours() * 60 + now.getMinutes();
}

function getAdjustedTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + timeOffset);
    return now;
}

function adjustTimeOffset(minutes) {
    timeOffset += minutes;
    manageCellStatesByTime();
    updateTimeDisplay();
    showNotification(`Time adjusted by ${minutes} minutes`);
}

function resetTimeOffset() {
    timeOffset = 0;
    manageCellStatesByTime();
    updateTimeDisplay();
    showNotification('Time reset to actual system time');
}

function toggleTimeManagement() {
    isTimeManagementActive = !isTimeManagementActive;
    const toggleBtn = document.getElementById('toggleTimeBtn');
    const timeStatus = document.getElementById('timeStatus');
    
    if (isTimeManagementActive) {
        toggleBtn.textContent = '⏸️ Pause Time Check';
        timeStatus.textContent = 'Time check active';
        timeStatus.className = 'time-status time-check-active';
        manageCellStatesByTime();
    } else {
        toggleBtn.textContent = '▶️ Resume Time Check';
        timeStatus.textContent = 'Time check paused';
        timeStatus.className = 'time-status time-check-paused';
        clearTimeFreeze();
    }
}

function manageCellStatesByTime() {
    if (!isTimeManagementActive) return;
    
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    const currentMinutes = getCurrentTimeInMinutes();
    const rows = tableBody.getElementsByTagName('tr');
    
    for (let row of rows) {
        const timeCell = row.cells[0];
        if (!timeCell) continue;
        
        const timeSlot = timeCell.textContent.trim();
        const slotMinutes = parseTimeToMinutes(timeSlot);
        const isPassed = currentMinutes >= slotMinutes;
        
        if (isPassed) {
            timeCell.classList.add('time-passed');
        } else {
            timeCell.classList.remove('time-passed');
        }
        
        for (let i = 1; i < row.cells.length; i++) {
            const cell = row.cells[i];
            const cellContent = cell.querySelector('.cell-content');
            
            if (cellContent) {
                if (isPassed) {
                    freezeCell(cellContent);
                } else {
                    unfreezeCell(cellContent);
                }
            }
        }
    }
}

function freezeCell(cellContent) {
    cellContent.classList.add('time-frozen');
    cellContent.onclick = null;
    
    const cancelBtn = cellContent.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.disabled = true;
    }
    
    if (!cellContent.querySelector('.past-indicator')) {
        const pastIndicator = document.createElement('div');
        pastIndicator.className = 'past-indicator';
        pastIndicator.textContent = 'PAST';
        cellContent.appendChild(pastIndicator);
    }
}

function unfreezeCell(cellContent) {
    cellContent.classList.remove('time-frozen');
    
    const cancelBtn = cellContent.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.disabled = false;
    }
    
    const pastIndicator = cellContent.querySelector('.past-indicator');
    if (pastIndicator) {
        pastIndicator.remove();
    }
}

function clearTimeFreeze() {
    const frozenCells = document.querySelectorAll('.time-frozen');
    frozenCells.forEach(cell => unfreezeCell(cell));
}

function updateTimeDisplay() {
    const adjustedTime = getAdjustedTime();
    const timeStr = adjustedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (timeOffset !== 0) {
        const sign = timeOffset > 0 ? '+' : '';
        const offsetDisplay = `Testing Time: ${timeStr} (${sign}${timeOffset} min)`;
        document.getElementById('timeStatus').textContent = offsetDisplay;
    }
}

// QR Code Functions
function generateQRCode() {
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
    
    const qrData = encodeURIComponent(registrationForm);
    const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}`;
    
    document.getElementById('qrCodeImage').src = qrCodeURL;
    document.getElementById('qrContainer').style.display = 'block';
}

// Venue Management Functions
function showAddVenueModal() {
    document.getElementById('venueModalTitle').textContent = 'Add New Venue';
    document.getElementById('venueName').value = '';
    document.getElementById('venueCapacity').value = '4';
    document.getElementById('venueStatus').value = 'open';
    loadTimeSlots();
    document.getElementById('venueModal').style.display = 'block';
}

function editVenue(venueName) {
    document.getElementById('venueModalTitle').textContent = 'Edit Venue';
    document.getElementById('venueName').value = venueName;
    document.getElementById('venueCapacity').value = venueCapacities[venueName];
    document.getElementById('venueStatus').value = venueStatus[venueName].open ? 'open' : 'closed';
    loadTimeSlots();
    document.getElementById('venueModal').style.display = 'block';
}

function deleteVenue(venueName) {
    if (confirm(`Are you sure you want to delete ${venueName}?`)) {
        const index = venues.indexOf(venueName);
        if (index > -1) {
            venues.splice(index, 1);
            delete venueCapacities[venueName];
            delete venueStatus[venueName];
            delete bookingData[venueName];
            loadVenueList();
        }
    }
}

function loadTimeSlots() {
    const editor = document.getElementById('timeSlotsEditor');
    editor.innerHTML = '';
    
    timeSlots.forEach((slot, index) => {
        const div = document.createElement('div');
        div.className = 'time-slot-item';
        div.innerHTML = `
            <input type="time" value="${slot}" onchange="updateTimeSlot(${index}, this.value)">
            <button type="button" class="remove-time-btn" onclick="removeTimeSlot(${index})">Remove</button>
        `;
        editor.appendChild(div);
    });
}

function addTimeSlot() {
    timeSlots.push('19:00');
    loadTimeSlots();
}

function removeTimeSlot(index) {
    if (timeSlots.length > 1) {
        timeSlots.splice(index, 1);
        loadTimeSlots();
    }
}

function updateTimeSlot(index, value) {
    timeSlots[index] = value;
}

function closeVenueModal() {
    document.getElementById('venueModal').style.display = 'none';
}

function loadVenueList() {
    const container = document.getElementById('venueList');
    container.innerHTML = '';
    
    venues.forEach(venue => {
        const div = document.createElement('div');
        div.className = 'venue-item';
        
        const isOpen = venueStatus[venue].open;
        const capacity = venueCapacities[venue];
        
        div.innerHTML = `
            <div class="venue-info">
                <h4>${venue}</h4>
                <p>Capacity: ${capacity} | Status: ${isOpen ? 'Open' : 'Closed'}</p>
            </div>
            <div class="venue-actions">
                <button class="edit-btn" onclick="editVenue('${venue}')">Edit</button>
                <button class="delete-btn" onclick="deleteVenue('${venue}')">Delete</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// Utility Functions
function getUserInitials(username) {
    if (!username) return '';
    
    const words = username.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    } else {
        return words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
    }
}

function isVenueOpenOnDate(venue, date) {
    const venueInfo = venueStatus[venue];
    if (!venueInfo.open) return false;
    
    const dateStr = date.toDateString();
    return !venueInfo.closedDates.includes(dateStr);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        font-weight: 600;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Login Functions
function login() {
    const userId = document.getElementById('userIdInput').value.trim();
    const adminCheck = document.getElementById('adminCheck').checked;
    
    if (userId) {
        currentUser = userId;
        currentUserSkillLevel = 'beginner';
        isAdmin = adminCheck;
        
        userSkillLevels[userId] = currentUserSkillLevel;
        
        if (isAdmin) {
            document.getElementById('adminUserDisplay').textContent = `Administrator: ${userId}`;
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('mainApp').style.display = 'none';
            document.getElementById('adminApp').style.display = 'block';
            initializeAdminApp();
        } else {
            updateUserDisplay();
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            document.getElementById('adminApp').style.display = 'none';
            initializeApp();
        }
    } else {
        alert('Please enter a valid User ID');
    }
}

function logout() {
    currentUser = '';
    currentUserSkillLevel = 'beginner';
    userBooking = null;
    isAdmin = false;
    timeOffset = 0;
    
    document.getElementById('userIdInput').value = '';
    document.getElementById('adminCheck').checked = false;
    
    if (timeCheckInterval) {
        clearInterval(timeCheckInterval);
        timeCheckInterval = null;
    }
    
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('adminApp').style.display = 'none';
    
    closeMessageBoard();
    closeAdminMessageBoard();
    closeVenueModal();
}

// Initialize Functions
function initializeBookingData() {
    venues.forEach(venue => {
        bookingData[venue] = {};
        timeSlots.forEach(time => {
            bookingData[venue][time] = [];
        });
    });
}

function addSampleBookings() {
    bookingData['Field 1']['19:00'] = ['John', 'Alice'];
    bookingData['Field 2']['19:20'] = ['Bob', 'Carol', 'Dave'];
    bookingData['Field 2']['23:00'] = ['Bob', 'Carol', 'Dave'];
    bookingData['Field 3']['20:00'] = ['Eve', 'Frank'];
    bookingData['Field 5']['23:00'] = ['Grace', 'Henry', 'Ivy', 'Jack'];
    bookingData['Field 7']['22:00'] = ['Kate', 'Liam'];
    bookingData['Field 4']['20:40'] = ['Sarah', 'Mike'];
    bookingData['Field 6']['21:40'] = ['Tom'];
    
    // Set sample skill levels
    userSkillLevels = {
        'John': 'beginner', 'Alice': 'advanced', 'Bob': 'beginner',
        'Carol': 'advanced', 'Dave': 'beginner', 'Eve': 'advanced',
        'Frank': 'beginner', 'Grace': 'advanced', 'Henry': 'beginner',
        'Ivy': 'advanced', 'Jack': 'beginner', 'Kate': 'advanced',
        'Liam': 'beginner', 'Sarah': 'advanced', 'Mike': 'beginner',
        'Tom': 'advanced'
    };
}

function initializeApp() {
    initializeBookingData();
    addSampleBookings();
    populateFilters();
    generateTable();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Initialize time management
    if (timeCheckInterval) {
        clearInterval(timeCheckInterval);
    }
    timeCheckInterval = setInterval(manageCellStatesByTime, 60000);
    manageCellStatesByTime();
}

function initializeAdminApp() {
    initializeBookingData();
    addSampleBookings();
    loadVenueList();
    loadUserMembership();
    updateAdminCurrentTime();
    setInterval(updateAdminCurrentTime, 1000);
}

function updateCurrentTime() {
    const now = getAdjustedTime();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const dateStr = now.toLocaleDateString(undefined, dateOptions);
    const timeStr = now.toLocaleTimeString(undefined, timeOptions);
    document.getElementById('currentTime').textContent = `${dateStr} ${timeStr}`;
}

function updateAdminCurrentTime() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const dateStr = now.toLocaleDateString(undefined, dateOptions);
    const timeStr = now.toLocaleTimeString(undefined, timeOptions);
    document.getElementById('adminCurrentTime').textContent = `${dateStr} ${timeStr}`;
}

// Table Functions
function populateFilters() {
    const venueFilter = document.getElementById('venueFilter');
    const timeFilter = document.getElementById('timeFilter');
    
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

function generateTable() {
    const header = document.getElementById('tableHeader');
    const body = document.getElementById('tableBody');
    
    header.innerHTML = '';
    body.innerHTML = '';
    
    const filteredVenues = getFilteredVenues();
    let filteredTimes = getFilteredTimes();

    // Create header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Time / Field</th>';
    filteredVenues.forEach(venue => {
        headerRow.innerHTML += `<th>${venue}</th>`;
    });
    header.appendChild(headerRow);
    
    // Create body rows
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
    
    setTimeout(manageCellStatesByTime, 100);
}

function createCellContent(venue, time) {
    const cellDiv = document.createElement('div');
    cellDiv.className = 'cell-content';
    
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
            
            const userSkillLevel = userSkillLevels[user] || 'beginner';
            initialsCircle.classList.add(userSkillLevel);
            
            if (user === currentUser) {
                initialsCircle.classList.add('current-user');
            }
            
            initialsCircle.textContent = getUserInitials(user);
            initialsCircle.title = `${user} (${userSkillLevel === 'beginner' ? 'Beginner' : 'Advanced'})`;
            
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

function getFilteredVenues() {
    const filter = document.getElementById('venueFilter').value;
    return filter ? [filter] : venues;
}

function getFilteredTimes() {
    const filter = document.getElementById('timeFilter').value;
    return filter ? [filter] : timeSlots;
}

function filterTable() {
    generateTable();
}

function filterUpcoming() {
    // Filter to show only available slots
    const venueFilter = document.getElementById('venueFilter');
    const timeFilter = document.getElementById('timeFilter');
    
    venueFilter.value = "";
    timeFilter.value = "";
    
    generateTable();
}

// Booking Functions
function bookSlot(venue, time) {
    if (!isVenueOpenOnDate(venue, new Date())) {
        alert('This venue is currently closed.');
        return;
    }
    
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
        
        setTimeout(() => {
            alert(`Successfully booked ${venue} at ${time}`);
        }, 100);
    } else {
        alert('This slot is fully booked!');
    }
}

function cancelBooking() {
    if (userBooking) {
        const { venue, time } = userBooking;
        
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
        
        setTimeout(() => {
            alert(`Booking cancelled for ${venue} at ${time}`);
        }, 100);
    }
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
        content.innerHTML = '<div style="text-align: center; color: #666; font-style: italic; padding: 40px;">No messages available.</div>';
        return;
    }

    const sortedMessages = [...messages].sort((a, b) => b.timestamp - a.timestamp);
    
    content.innerHTML = sortedMessages.map(message => `
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 15px; padding: 20px; margin-bottom: 15px; border-left: 5px solid #4facfe;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-weight: 600; color: #4facfe;">${message.author}</span>
                <span style="font-size: 12px; color: #666;">${message.date}</span>
            </div>
            <div style="color: #333; line-height: 1.6;">${message.text}</div>
        </div>
    `).join('');
}

// Admin Message Board Functions
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
        content.innerHTML = '<div style="text-align: center; color: #666; font-style: italic; padding: 40px;">No messages available.</div>';
        return;
    }

    const sortedMessages = [...messages].sort((a, b) => b.timestamp - a.timestamp);
    
    content.innerHTML = sortedMessages.map(message => `
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 15px; padding: 20px; margin-bottom: 15px; border-left: 5px solid #4facfe;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 10px;">
                <span style="font-weight: 600; color: #4facfe;">${message.author}</span>
                <span style="font-size: 12px; color: #666;">${message.date}</span>
                <button onclick="editMessage(${message.id})" style="padding: 4px 8px; border: none; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 600; background: #4facfe; color: white;">Edit</button>
                <button onclick="deleteMessage(${message.id})" style="padding: 4px 8px; border: none; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 600; background: #ff6b6b; color: white;">Delete</button>
            </div>
            <div style="color: #333; line-height: 1.6;">${message.text}</div>
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

// User Membership Functions
function loadUserMembership() {
    const container = document.getElementById('userMembershipContainer');
    container.innerHTML = '';
    
    Object.entries(userMembership).forEach(([username, data]) => {
        const userDiv = document.createElement('div');
        userDiv.style.cssText = `
            display: grid;
            grid-template-columns: 1fr auto auto;
            gap: 15px;
            align-items: center;
            padding: 20px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 10px;
            border-left: 5px solid #4facfe;
            margin-bottom: 15px;
        `;
        
        const now = new Date();
        const isExpired = data.expiry < now;
        const timeLeft = data.expiry - now;
        const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
        
        userDiv.innerHTML = `
            <div>
                <div style="font-weight: 600; color: #333; font-size: 16px; margin-bottom: 5px;">${username}</div>
                <div style="display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; ${data.type === 'official' ? 'background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white;' : 'background: linear-gradient(135deg, #ffa502 0%, #ff6348 100%); color: white;'}">${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Member</div>
            </div>
            <div style="text-align: center;">
                <div style="font-weight: 600; color: #333;">Expires: ${data.expiry.toLocaleDateString()}</div>
                <div style="font-size: 12px; color: ${isExpired ? '#ff6b6b' : '#666'}; padding: 2px 6px; background: ${isExpired ? 'rgba(255, 107, 107, 0.1)' : 'rgba(79, 172, 254, 0.1)'}; border-radius: 4px; margin-top: 5px;">${isExpired ? 'EXPIRED' : daysLeft > 0 ? `${daysLeft} days left` : 'Expires today'}</div>
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="editUserMembership('${username}')" style="padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; background: #4facfe; color: white;">Edit</button>
                <button onclick="deleteUser('${username}')" style="padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; background: #ff6b6b; color: white;">Delete</button>
            </div>
        `;
        container.appendChild(userDiv);
    });
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

// Venue Form Handler
document.getElementById('venueForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('venueName').value.trim();
    const capacity = parseInt(document.getElementById('venueCapacity').value);
    const status = document.getElementById('venueStatus').value === 'open';
    
    if (!name) {
        alert('Please enter a venue name');
        return;
    }
    
    // Check if editing existing venue
    const isEditing = venues.includes(name);
    
    if (!isEditing) {
        venues.push(name);
    }
    
    venueCapacities[name] = capacity;
    venueStatus[name] = { open: status, closedDates: [] };
    
    // Initialize booking data for new venue
    if (!bookingData[name]) {
        bookingData[name] = {};
        timeSlots.forEach(time => {
            bookingData[name][time] = [];
        });
    }
    
    loadVenueList();
    closeVenueModal();
    
    if (isEditing) {
        alert(`Venue "${name}" updated successfully`);
    } else {
        alert(`Venue "${name}" added successfully`);
    }
});

// Handle escape key to close modals
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeMessageBoard();
        closeAdminMessageBoard();
        closeVenueModal();
    }
});

// Initialize when page loads
window.addEventListener('load', () => {
    // Set temporary member expiry to end of today
    userMembership['Temporary Member A'].expiry.setHours(23, 59, 59, 999);
});
