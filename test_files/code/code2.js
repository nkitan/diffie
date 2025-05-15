// File: code_modified.js
// Version: 1.1.0
// Description: A utility script for managing tasks, users, and projects.
// Changelog: Added Project class, improved error handling, new task methods.

const MAX_USERS = 150; // Increased user limit
const DEFAULT_TASK_PRIORITY = 'normal'; // Changed default priority term
const DEFAULT_PROJECT_STATUS = 'pending';

/**
 * Represents a User in the system.
 */
class User {
    constructor(id, username, email, fullName = '') { // Added fullName
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName || username; // Default fullName
        this.isActive = true;
        this.lastLogin = new Date(); // Set lastLogin on creation
        this.tasks = [];
        this.projects = []; // New: user can be part of projects
    }

    // activate method removed as users are active by default on creation

    deactivate() {
        this.isActive = false;
        // Adding more detailed logging for deactivation
        console.warn(`User ${this.username} (ID: ${this.id}) has been deactivated.`);
    }

    updateEmail(newEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (newEmail && emailRegex.test(newEmail)) {
            this.email = newEmail;
            console.info(`Email successfully updated for ${this.username} to ${newEmail}.`); // Changed log level
            return true;
        }
        console.error(`Invalid or missing email format: ${newEmail}`);
        return false;
    }

    addTask(task) {
        if (task && task instanceof Task) { // Added type check for task
            this.tasks.push(task);
            // console.log(`Task "${task.title}" added for user ${this.username}.`); // Removed redundant log
        } else {
            console.warn('Attempted to add invalid task object.');
        }
    }

    getTaskCount() {
        return this.tasks.length;
    }

    // New method
    getPendingTasks() {
        return this.tasks.filter(task => !task.isCompleted);
    }

    assignToProject(project) {
        if (project && project instanceof Project) {
            this.projects.push(project.id);
            project.addMember(this);
            console.log(`User ${this.username} assigned to project "${project.name}".`);
        }
    }
}

/**
 * Represents a Task.
 */
class Task {
    constructor(id, title, description, priority = DEFAULT_TASK_PRIORITY, dueDate = null) { // Added dueDate
        this.id = id;
        this.title = title;
        this.description = description;
        this.isCompleted = false;
        this.priority = priority;
        this.createdAt = new Date();
        this.updatedAt = new Date(); // New: track updates
        this.assignee = null;
        this.dueDate = dueDate ? new Date(dueDate) : null; // Process dueDate
        this.projectId = null; // New: task can belong to a project
    }

    complete() {
        this.isCompleted = true;
        this.updatedAt = new Date();
        console.log(`Task "${this.title}" (ID: ${this.id}) marked as completed.`); // Added ID to log
    }
    
    // New method
    setInProgress() {
        if(!this.isCompleted) {
            console.log(`Task "${this.title}" status set to in-progress.`);
            this.status = 'in-progress'; // Assuming a status property for tasks might be added
            this.updatedAt = new Date();
        }
    }

    assignTo(user) {
        if (user instanceof User && user.isActive) { // Check if user is active
            this.assignee = user.id; // Store user ID instead of object
            user.addTask(this); 
            console.log(`Task "${this.title}" assigned to active user ${user.username}.`);
        } else {
            console.error("Invalid or inactive user object provided for task assignment.");
        }
    }
    
    // This method is moved to the top of the class for better organization
    getDetails() {
        let details = `Task: ${this.title} (ID: ${this.id}) - Priority: ${this.priority}, Completed: ${this.isCompleted}`;
        if (this.dueDate) {
            details += `, Due: ${this.dueDate.toLocaleDateString()}`;
        }
        if (this.projectId) {
            details += `, Project ID: ${this.projectId}`;
        }
        return details;
    }

    setDueDate(dateString) {
        this.dueDate = new Date(dateString);
        this.updatedAt = new Date();
        console.log(`Due date for task "${this.title}" set to ${this.dueDate.toLocaleDateString()}.`);
    }
}

/**
 * New Class: Project
 */
class Project {
    constructor(id, name, description) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.members = []; // User IDs
        this.tasks = []; // Task IDs
        this.status = DEFAULT_PROJECT_STATUS;
        this.createdAt = new Date();
    }

    addMember(user) {
        if (user instanceof User && !this.members.includes(user.id)) {
            this.members.push(user.id);
        }
    }

    addTask(task) {
        if (task instanceof Task && !this.tasks.includes(task.id)) {
            this.tasks.push(task.id);
            task.projectId = this.id; // Link task to project
        }
    }

    getProjectSummary() {
        return `Project: ${this.name} (ID: ${this.id}), Status: ${this.status}, Members: ${this.members.length}, Tasks: ${this.tasks.length}`;
    }
}


// Utility functions
function generateUniqueId(prefix = 'id_') { // Added prefix and improved randomness
    return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function logSystemEvent(message, level = 'INFO') { // Changed name and added level
    const timestamp = new Date().toISOString();
    console.log(`[${level} ${timestamp}] ${message}`);
}

// Global collections
let users = [];
let tasks = [];
let projects = []; // New global list for projects

function initializeSystem() {
    logSystemEvent("System initializing (v1.1.0)...", "SYSTEM");
    
    const user1 = new User(generateUniqueId('usr_'), 'john_doe', 'john.doe@example.com', 'Johnathan Doe');
    const user2 = new User(generateUniqueId('usr_'), 'jane_smith', 'jane.smith@example.net'); // Changed domain
    const user3 = new User(generateUniqueId('usr_'), 'alice_gp', 'alice.gp@example.org', 'Alice Green-Paul'); // New user
    users.push(user1, user2, user3);

    const projectAlpha = new Project(generateUniqueId('proj_'), 'Project Alpha', 'Initial project for core features.');
    projects.push(projectAlpha);

    const task1 = new Task(generateUniqueId('tsk_'), 'Setup project environment', 'Install all necessary dependencies and tools.', 'high', '2025-06-15');
    const task2 = new Task(generateUniqueId('tsk_'), 'Draft initial proposal', 'Create the first draft of the project proposal.', 'critical', '2025-05-30'); // Priority changed
    const task3 = new Task(generateUniqueId('tsk_'), 'User authentication module', 'Develop the user login and registration.', 'high', '2025-07-01'); // New task

    task1.assignTo(user1);
    task2.assignTo(user2);
    task3.assignTo(user1);
    
    projectAlpha.addTask(task1);
    projectAlpha.addTask(task2);
    projectAlpha.addTask(task3);
    user1.assignToProject(projectAlpha);
    user2.assignToProject(projectAlpha);
    user3.assignToProject(projectAlpha); // Alice also on project Alpha

    tasks.push(task1, task2, task3);

    logSystemEvent("System initialized with users, tasks, and projects.", "SYSTEM");
    logSystemEvent(`Current user count: ${users.length}, Project count: ${projects.length}`);
}

function findUserByUsername(username) {
    if (!username) return null; // Added guard clause
    return users.find(user => user.username.toLowerCase() === username.toLowerCase()); // Case-insensitive search
}

function findTaskById(taskId) {
    if (!taskId) return null;
    return tasks.find(task => task.id === taskId);
}

// New function
function getTasksByPriority(priorityLevel) {
    return tasks.filter(task => task.priority === priorityLevel);
}

// Main execution block
if (require.main === module) {
    initializeSystem();
    
    const john = findUserByUsername('john_doe');
    if (john) {
        john.updateEmail('john.doe.updated@example.com'); // Email changed
        const newTaskForJohn = new Task(generateUniqueId('tsk_'), 'Review project documentation', 'Go over the new project design documents.', 'normal', '2025-06-10');
        // Task assignment now handles adding to user's list
        newTaskForJohn.assignTo(john);
        tasks.push(newTaskForJohn); // Still need to add to global list
        
        // Assign to a project if applicable
        const mainProject = projects.find(p => p.name === 'Project Alpha');
        if (mainProject) {
            mainProject.addTask(newTaskForJohn);
        }
    }

    // Example of using new functionality
    const criticalTasks = getTasksByPriority('critical');
    console.log(`Critical priority tasks: ${criticalTasks.length}`);
    criticalTasks.forEach(task => console.log(`  - ${task.getDetails()}`));


    tasks.forEach(task => {
        if (task.title.includes('proposal') && !task.isCompleted) {
            task.complete();
        }
        if (task.title.includes('environment') && !task.isCompleted) {
            task.setInProgress(); // New action
        }
    });

    // Display project summaries
    projects.forEach(project => console.log(project.getProjectSummary()));

    logSystemEvent("All operations complete. System shutting down gracefully.", "SYSTEM");
}

// End of file v1.1.0