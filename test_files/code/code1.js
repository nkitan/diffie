// File: code_original.js
// Version: 1.0.0
// Description: A utility script for managing tasks and users.

const MAX_USERS = 100;
const DEFAULT_TASK_PRIORITY = 'medium';

/**
 * Represents a User in the system.
 */
class User {
    constructor(id, username, email) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.isActive = true;
        this.lastLogin = null;
        this.tasks = [];
    }

    activate() {
        this.isActive = true;
        console.log(`User ${this.username} activated.`);
    }

    deactivate() {
        this.isActive = false;
        console.log(`User ${this.username} deactivated.`);
    }

    updateEmail(newEmail) {
        // Basic email validation
        if (newEmail && newEmail.includes('@')) {
            this.email = newEmail;
            console.log(`Email updated for ${this.username} to ${newEmail}.`);
            return true;
        }
        console.error(`Invalid email format: ${newEmail}`);
        return false;
    }

    addTask(task) {
        if (task) {
            this.tasks.push(task);
            console.log(`Task "${task.title}" added for user ${this.username}.`);
        }
    }

    getTaskCount() {
        return this.tasks.length;
    }
}

/**
 * Represents a Task.
 */
class Task {
    constructor(id, title, description, priority = DEFAULT_TASK_PRIORITY) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.isCompleted = false;
        this.priority = priority;
        this.createdAt = new Date();
        this.assignee = null; // Will be assigned a User object
    }

    complete() {
        this.isCompleted = true;
        console.log(`Task "${this.title}" marked as completed.`);
    }

    assignTo(user) {
        if (user instanceof User) {
            this.assignee = user;
            user.addTask(this); // Add task to user's list
            console.log(`Task "${this.title}" assigned to ${user.username}.`);
        } else {
            console.error("Invalid user object provided for assignment.");
        }
    }

    getDetails() {
        return `Task: ${this.title} (ID: ${this.id}) - Priority: ${this.priority}, Completed: ${this.isCompleted}`;
    }
}

// Utility functions
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function logSystemStatus(message) {
    const timestamp = new Date().toISOString();
    console.log(`[STATUS ${timestamp}] ${message}`);
}

// Initial setup
let users = [];
let tasks = [];

function initializeSystem() {
    logSystemStatus("System initializing...");
    const user1 = new User(generateId(), 'john_doe', 'john.doe@example.com');
    const user2 = new User(generateId(), 'jane_smith', 'jane.smith@example.com');
    users.push(user1, user2);

    const task1 = new Task(generateId(), 'Setup project environment', 'Install all necessary dependencies and tools.');
    const task2 = new Task(generateId(), 'Draft initial proposal', 'Create the first draft of the project proposal.', 'high');
    
    task1.assignTo(user1);
    task2.assignTo(user2);
    
    tasks.push(task1, task2);

    logSystemStatus("System initialized with default users and tasks.");
    logSystemStatus(`Current user count: ${users.length}`);
}

function findUserByUsername(username) {
    return users.find(user => user.username === username);
}

function findTaskById(taskId) {
    return tasks.find(task => task.id === taskId);
}

// Example Usage (to be expanded later)
if (require.main === module) {
    initializeSystem();
    
    const john = findUserByUsername('john_doe');
    if (john) {
        john.updateEmail('john.d@example.com');
        const newTaskForJohn = new Task(generateId(), 'Review documentation', 'Go over the project docs.');
        john.addTask(newTaskForJohn); // This is a direct add, task not in global 'tasks' list yet
        tasks.push(newTaskForJohn); // Add to global list
        newTaskForJohn.assignTo(john); // Correctly assign
    }

    const highPriorityTasks = tasks.filter(task => task.priority === 'high');
    console.log(`High priority tasks: ${highPriorityTasks.length}`);

    tasks.forEach(task => {
        if (task.title.includes('proposal')) {
            task.complete();
        }
    });

    logSystemStatus("Initial operations complete.");
}

// End of file v1.0.0