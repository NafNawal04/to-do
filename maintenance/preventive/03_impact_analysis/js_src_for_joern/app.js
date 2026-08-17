// State Variables
let tasks = [];
let activeFilter = 'all';
let activeTagFilter = null;
let searchQuery = '';
let currentUser = null;

// Pomodoro Timer State
let timerInterval = null;
let timerTimeLeft = 1500; // 25 minutes default
let timerActiveMode = '1500';
let activeFocusTaskTitle = '';

// Audio Elements
const reminderSound = document.getElementById('reminder-sound');
const pomodoroSound = document.getElementById('pomodoro-sound');

// DOM Elements
const authOverlay = document.getElementById('auth-overlay');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const tabLoginBtn = document.getElementById('tab-login-btn');
const tabRegisterBtn = document.getElementById('tab-register-btn');
const loginErrorMsg = document.getElementById('login-error-msg');
const registerErrorMsg = document.getElementById('register-error-msg');
const registerSuccessMsg = document.getElementById('register-success-msg');
const userDisplayName = document.getElementById('user-display-name');
const logoutBtn = document.getElementById('logout-btn');

const taskForm = document.getElementById('task-form');
const tasksContainer = document.getElementById('tasks-container');
const totalTasksEl = document.getElementById('total-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const completionRateEl = document.getElementById('completion-rate');
const searchInput = document.getElementById('search-input');
const tagsFilterBar = document.getElementById('tags-filter-bar');
const themeToggle = document.getElementById('theme-toggle');
const enableNotificationsBtn = document.getElementById('enable-notifications');

// Timer DOM Elements
const timerDisplay = document.getElementById('timer-display');
const timerStartBtn = document.getElementById('timer-start');
const timerPauseBtn = document.getElementById('timer-pause');
const timerResetBtn = document.getElementById('timer-reset');
const timerModeEls = document.querySelectorAll('.timer-mode');
const activeFocusTaskEl = document.getElementById('active-focus-task');

// Token management
function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
}

function getAuthHeaders() {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    initNotificationPermission();
    
    // Check if user is logged in
    checkAuthSession();
    
    // Periodically check for due tasks (every 10 seconds)
    setInterval(checkDueTasks, 10000);
});

// Event Listeners
function setupEventListeners() {
    // Auth Tab switching
    tabLoginBtn.addEventListener('click', () => {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginErrorMsg.textContent = '';
        registerErrorMsg.textContent = '';
        registerSuccessMsg.textContent = '';
    });

    tabRegisterBtn.addEventListener('click', () => {
        tabRegisterBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        loginErrorMsg.textContent = '';
        registerErrorMsg.textContent = '';
        registerSuccessMsg.textContent = '';
    });

    // Auth actions
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);

    // Task submission
    taskForm.addEventListener('submit', handleTaskSubmit);
    
    // Filters (All, Pending, Completed)
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeFilter = e.target.getAttribute('data-filter');
            renderTasks();
        });
    });
    
    // Search
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        fetchTasks(searchQuery);
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Enable Notifications
    enableNotificationsBtn.addEventListener('click', requestNotificationPermission);
    
    // Pomodoro Controls
    timerStartBtn.addEventListener('click', startTimer);
    timerPauseBtn.addEventListener('click', pauseTimer);
    timerResetBtn.addEventListener('click', resetTimer);
    
    timerModeEls.forEach(el => {
        el.addEventListener('click', (e) => {
            timerModeEls.forEach(item => item.classList.remove('active'));
            e.target.classList.add('active');
            const timeVal = e.target.getAttribute('data-time');
            timerActiveMode = timeVal;
            timerTimeLeft = parseInt(timeVal);
            updateTimerDisplay();
            pauseTimer();
        });
    });
}

// Authentication handlers
async function checkAuthSession() {
    const token = getToken();
    if (!token) {
        showAuthScreen();
        return;
    }
    
    try {
        const response = await fetch('/api/auth/me', {
            headers: getAuthHeaders()
        });
        if (response.ok) {
            currentUser = await response.json();
            showDashboard();
        } else {
            removeToken();
            showAuthScreen();
        }
    } catch (err) {
        console.error('Session verify failed:', err);
        showAuthScreen();
    }
}

function showAuthScreen() {
    authOverlay.classList.remove('hidden');
    appContainer.classList.add('hidden');
}

function showDashboard() {
    authOverlay.classList.add('hidden');
    appContainer.classList.remove('hidden');
    userDisplayName.textContent = currentUser.username;
    fetchTasks();
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    loginErrorMsg.textContent = '';
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            setToken(data.access_token);
            checkAuthSession();
        } else {
            loginErrorMsg.textContent = data.detail || 'Login failed';
        }
    } catch (err) {
        loginErrorMsg.textContent = 'Server connection failed';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    
    registerErrorMsg.textContent = '';
    registerSuccessMsg.textContent = '';
    
    if (password !== confirmPassword) {
        registerErrorMsg.textContent = 'Passwords do not match';
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            registerSuccessMsg.textContent = 'Account created! Switching to Login tab...';
            registerForm.reset();
            setTimeout(() => {
                tabLoginBtn.click();
                document.getElementById('login-username').value = username;
            }, 1500);
        } else {
            registerErrorMsg.textContent = data.detail || 'Registration failed';
        }
    } catch (err) {
        registerErrorMsg.textContent = 'Server connection failed';
    }
}

function handleLogout() {
    removeToken();
    currentUser = null;
    tasks = [];
    triggeredReminders.clear();
    pauseTimer();
    resetTimer();
    activeFocusTaskTitle = '';
    activeFocusTaskEl.textContent = 'No active focus task';
    showAuthScreen();
}

// Fetch Tasks from API
async function fetchTasks(search = '') {
    try {
        let url = '/api/tasks';
        if (search) {
            url += `?search=${encodeURIComponent(search)}`;
        }
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            handleLogout();
            return;
        }
        
        if (!response.ok) throw new Error('Failed to load tasks');
        tasks = await response.json();
        renderTasks();
        updateStats();
        renderTagsFilterBar();
    } catch (err) {
        console.error('Error fetching tasks:', err);
    }
}

// Render Tasks
function renderTasks() {
    tasksContainer.innerHTML = '';
    
    // Filter tasks
    let filteredTasks = tasks;
    
    // Status Filter
    if (activeFilter === 'pending') {
        filteredTasks = filteredTasks.filter(t => t.status === 'pending');
    } else if (activeFilter === 'completed') {
        filteredTasks = filteredTasks.filter(t => t.status === 'completed');
    }
    
    // Tag Filter
    if (activeTagFilter) {
        filteredTasks = filteredTasks.filter(t => t.tag === activeTagFilter);
    }
    
    if (filteredTasks.length === 0) {
        tasksContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-square-check empty-icon"></i>
                <p>No tasks match the filter criteria.</p>
            </div>
        `;
        return;
    }
    
    const now = new Date();
    
    filteredTasks.forEach(task => {
        const isOverdue = task.due_date && new Date(task.due_date) < now && task.status === 'pending';
        const formattedDate = task.due_date ? new Date(task.due_date).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'}) : null;
        
        const taskEl = document.createElement('div');
        taskEl.className = `task-item ${task.status === 'completed' ? 'completed' : ''}`;
        taskEl.innerHTML = `
            <div class="task-header-row">
                <div class="task-main-info">
                    <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" data-id="${task.id}"></div>
                    <span class="task-item-title">${escapeHTML(task.title)}</span>
                </div>
                <div class="task-actions">
                    <button class="action-btn focus" title="Focus with Pomodoro" data-id="${task.id}" data-title="${task.title}">
                        <i class="fa-solid fa-crosshair"></i>
                    </button>
                    <button class="action-btn delete" title="Delete Task" data-id="${task.id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            ${task.description ? `<div class="task-body-row">${escapeHTML(task.description)}</div>` : ''}
            <div class="task-meta-row">
                <span class="badge badge-priority ${task.priority}">${task.priority}</span>
                ${task.tag ? `<span class="badge badge-tag">${escapeHTML(task.tag)}</span>` : ''}
                ${formattedDate ? `<span class="badge badge-due ${isOverdue ? 'overdue' : ''}"><i class="fa-regular fa-clock"></i> ${formattedDate}</span>` : ''}
            </div>
        `;
        
        // Add event listeners on task-item components
        taskEl.querySelector('.task-checkbox').addEventListener('click', () => toggleTaskStatus(task.id, task.status));
        taskEl.querySelector('.action-btn.delete').addEventListener('click', () => deleteTask(task.id));
        taskEl.querySelector('.action-btn.focus').addEventListener('click', () => setFocusTask(task.title));
        
        tasksContainer.appendChild(taskEl);
    });
}

// Add Task
async function handleTaskSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-desc').value.trim();
    const priority = document.getElementById('task-priority').value;
    const tag = document.getElementById('task-tag').value.trim() || null;
    const due_date = document.getElementById('task-due').value || null;
    
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ title, description, priority, tag, due_date })
        });
        
        if (response.status === 401) {
            handleLogout();
            return;
        }
        
        if (!response.ok) throw new Error('Task creation failed');
        
        taskForm.reset();
        fetchTasks();
    } catch (err) {
        console.error('Error adding task:', err);
    }
}

// Toggle Task Status
async function toggleTaskStatus(id, currentStatus) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.status === 401) {
            handleLogout();
            return;
        }
        
        if (!response.ok) throw new Error('Update failed');
        fetchTasks();
    } catch (err) {
        console.error('Error updating task:', err);
    }
}

// Delete Task
async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            handleLogout();
            return;
        }
        
        if (!response.ok) throw new Error('Deletion failed');
        fetchTasks();
    } catch (err) {
        console.error('Error deleting task:', err);
    }
}

// Set Active Focus Task for Pomodoro
function setFocusTask(title) {
    activeFocusTaskTitle = title;
    activeFocusTaskEl.textContent = `Focusing on: ${title}`;
    // Highlight focus panel
    const focusPanel = document.querySelector('.pomodoro-panel');
    focusPanel.style.borderColor = 'var(--accent-color)';
    setTimeout(() => {
        focusPanel.style.borderColor = 'rgba(255, 255, 255, 0.05)';
    }, 1000);
}

// Render Unique Tags Filter Bar
function renderTagsFilterBar() {
    // Get list of unique tags
    const tags = [...new Set(tasks.map(t => t.tag).filter(Boolean))];
    
    tagsFilterBar.innerHTML = '';
    if (tags.length === 0) {
        tagsFilterBar.classList.add('hidden');
        return;
    }
    tagsFilterBar.classList.remove('hidden');
    
    // Add "All Tags" pill
    const allPill = document.createElement('span');
    allPill.className = `tag-pill ${!activeTagFilter ? 'active' : ''}`;
    allPill.textContent = 'All Tags';
    allPill.addEventListener('click', () => {
        activeTagFilter = null;
        document.querySelectorAll('.tag-pill').forEach(p => p.classList.remove('active'));
        allPill.classList.add('active');
        renderTasks();
    });
    tagsFilterBar.appendChild(allPill);
    
    tags.forEach(tag => {
        const pill = document.createElement('span');
        pill.className = `tag-pill ${activeTagFilter === tag ? 'active' : ''}`;
        pill.textContent = tag;
        pill.addEventListener('click', () => {
            activeTagFilter = tag;
            document.querySelectorAll('.tag-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            renderTasks();
        });
        tagsFilterBar.appendChild(pill);
    });
}

// Update Stats
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    completionRateEl.textContent = `${rate}%`;
}

// Check for Due Tasks & Trigger Reminders
let triggeredReminders = new Set(); // Track tasks we already alerted on to avoid duplicate notifications in active session

function checkDueTasks() {
    if (!getToken()) return; // Don't check reminders if not logged in
    
    const now = new Date();
    tasks.forEach(task => {
        if (task.status === 'pending' && task.due_date) {
            const dueTime = new Date(task.due_date);
            // Alert if the due date is reached or passed, and not already triggered
            if (dueTime <= now && !triggeredReminders.has(task.id)) {
                triggeredReminders.add(task.id);
                triggerNotification(task.title, task.description || 'Task due time reached!');
                fetchTasks(); // Reload to highlight overdue badge
            }
        }
    });
}

// Trigger browser and audio alerts
function triggerNotification(title, body) {
    // Play reminder sound
    if (reminderSound) {
        reminderSound.currentTime = 0;
        reminderSound.play().catch(e => console.log('Audio playback prevented by browser policies.'));
    }
    
    // Browser notification
    if (Notification.permission === 'granted') {
        new Notification(`⏰ Task Reminder: ${title}`, {
            body: body,
            icon: 'https://cdn-icons-png.flaticon.com/512/2098/2098402.png'
        });
    } else {
        alert(`⏰ Task Reminder: ${title}\n${body}`);
    }
}

// Pomodoro Timer Logic
function updateTimerDisplay() {
    const minutes = Math.floor(timerTimeLeft / 60);
    const seconds = timerTimeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (timerInterval) return;
    
    timerStartBtn.classList.add('hidden');
    timerPauseBtn.classList.remove('hidden');
    
    timerInterval = setInterval(() => {
        if (timerTimeLeft > 0) {
            timerTimeLeft--;
            updateTimerDisplay();
        } else {
            // Timer Finished
            clearInterval(timerInterval);
            timerInterval = null;
            timerStartBtn.classList.remove('hidden');
            timerPauseBtn.classList.add('hidden');
            
            // Play alarm sound
            if (pomodoroSound) {
                pomodoroSound.play().catch(e => console.log('Audio prevented'));
            }
            
            // Show Notification
            const modeName = timerActiveMode === '1500' ? 'Focus Session' : 'Break';
            if (Notification.permission === 'granted') {
                new Notification(`🔔 Pomodoro Complete!`, {
                    body: `Your ${modeName} has ended. Take a moment!`,
                    icon: 'https://cdn-icons-png.flaticon.com/512/2098/2098402.png'
                });
            } else {
                alert(`🔔 Pomodoro: ${modeName} completed!`);
            }
            
            // Log completion status in focus label
            if (timerActiveMode === '1500' && activeFocusTaskTitle) {
                activeFocusTaskEl.textContent = `Completed focus session for: ${activeFocusTaskTitle}`;
            }
        }
    }, 1000);
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerStartBtn.classList.remove('hidden');
    timerPauseBtn.classList.add('hidden');
}

function resetTimer() {
    pauseTimer();
    timerTimeLeft = parseInt(timerActiveMode);
    updateTimerDisplay();
}

// Notifications permissions
function initNotificationPermission() {
    if (Notification.permission === 'granted') {
        enableNotificationsBtn.classList.add('hidden');
    }
}

function requestNotificationPermission() {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            enableNotificationsBtn.classList.add('hidden');
            new Notification('Notifications Enabled!', {
                body: 'ZenTask Pro will alert you when tasks are due.',
                icon: 'https://cdn-icons-png.flaticon.com/512/2098/2098402.png'
            });
        }
    });
}

// Theme handling
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}

function toggleTheme() {
    if (document.body.classList.contains('dark-theme')) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        localStorage.setItem('theme', 'dark');
    }
}

// Utility to escape HTML
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
