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

// Booking data: venue -> time -> [users]
let bookingData = {};
let currentUser = '';
let userBooking = null; // {venue: '', time: ''}

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
    if (userId) {
        currentUser = userId;
        document.getElementById('userDisplay').textContent = `User: ${userId}`;
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        initializeApp();
    } else {
        alert('Please enter a valid User ID');
    }
}

// Logout function
function logout() {
    currentUser = '';
    userBooking = null;
    document.getElementById('userIdInput').value = '';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
    closeMessageBoard();
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
            
            // Highlight current user's circle
            if (user === currentUser) {
                initialsCircle.classList.add('current-user');
            }
            
            initialsCircle.textContent = getUserInitials(user);
            initialsCircle.title = user; // Tooltip showing full username
            
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
    // Add some random bookings
    bookingData['Field 1']['19:00'] = ['John', 'Alice'];
    bookingData['Field 2']['19:20'] = ['Bob', 'Carol', 'Dave'];
    bookingData['Field 3']['20:00'] = ['Eve', 'Frank'];
    bookingData['Field 5']['21:00'] = ['Grace', 'Henry', 'Ivy', 'Jack'];
    bookingData['Field 7']['22:00'] = ['Kate', 'Liam'];
}

// Handle escape key to close message board
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeMessageBoard();
    }
});

// Initialize with sample data when page loads
window.addEventListener('load', () => {
    addSampleBookings();
});
