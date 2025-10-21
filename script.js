// Application State Management
const AppState = {
    currentUser: null,
    userRole: null,
    currentPage: 'dashboard',
    theme: localStorage.getItem('theme') || 'light',
    students: JSON.parse(localStorage.getItem('students')) || [],
    teachers: JSON.parse(localStorage.getItem('teachers')) || [],
    attendance: JSON.parse(localStorage.getItem('attendance')) || [],
    grades: JSON.parse(localStorage.getItem('grades')) || [],
    placements: JSON.parse(localStorage.getItem('placements')) || [],
    schools: JSON.parse(localStorage.getItem('schools')) || []
};

// DOM Elements
const DOM = {
    authSection: document.getElementById('authSection'),
    appSection: document.getElementById('appSection'),
    loginForm: document.getElementById('loginForm'),
    sidebar: document.getElementById('sidebar'),
    mainContent: document.getElementById('mainContent'),
    themeToggle: document.getElementById('themeToggle'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    userRole: document.getElementById('userRole'),
    toastContainer: document.getElementById('toastContainer')
};

// Utility Functions
const Utils = {
    // Show toast notification
    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        DOM.toastContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-GH', {
            style: 'currency',
            currency: 'GHS'
        }).format(amount);
    },

    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-GH');
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Validate email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Show modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    // Hide modal
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    // Export data to Excel
    exportToExcel(data, filename) {
        try {
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
            XLSX.writeFile(wb, `${filename}.xlsx`);
            Utils.showToast('Data exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            Utils.showToast('Error exporting data', 'error');
        }
    },

    // Export data to PDF
    exportToPDF(data, filename, columns) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.text(filename, 14, 15);
            doc.autoTable({
                startY: 20,
                head: [columns],
                body: data.map(item => columns.map(col => item[col] || '')),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [114, 47, 55] }
            });
            
            doc.save(`${filename}.pdf`);
            Utils.showToast('PDF exported successfully', 'success');
        } catch (error) {
            console.error('PDF export error:', error);
            Utils.showToast('Error exporting PDF', 'error');
        }
    }
};

// Authentication Management
const Auth = {
    // Demo user database
    users: {
        admin: { password: 'admin123', role: 'admin', name: 'System Administrator' },
        teacher: { password: 'teacher123', role: 'teacher', name: 'John Teacher' },
        staff: { password: 'staff123', role: 'staff', name: 'Jane Staff' },
        parent: { password: 'parent123', role: 'parent', name: 'Parent User' },
        student: { password: 'student123', role: 'student', name: 'Student User' }
    },

    login(username, password, role) {
        const user = this.users[username];
        
        if (user && user.password === password && user.role === role) {
            AppState.currentUser = username;
            AppState.userRole = role;
            
            // Store user session
            localStorage.setItem('currentUser', username);
            localStorage.setItem('userRole', role);
            
            this.initializeUserSession(user);
            Utils.showToast(`Welcome back, ${user.name}!`, 'success');
            return true;
        }
        
        Utils.showToast('Invalid login credentials', 'error');
        return false;
    },

    initializeUserSession(user) {
        DOM.userName.textContent = user.name;
        DOM.userRole.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        DOM.userAvatar.textContent = user.name.charAt(0).toUpperCase();
        
        // Show/hide features based on role
        this.setupRoleBasedAccess(user.role);
        
        // Switch to app view
        DOM.authSection.style.display = 'none';
        DOM.appSection.classList.add('active');
    },

    setupRoleBasedAccess(role) {
        const adminOnly = document.querySelectorAll('[data-role="admin"]');
        const teacherOnly = document.querySelectorAll('[data-role="teacher"]');
        
        // Hide all restricted elements first
        adminOnly.forEach(el => el.style.display = 'none');
        teacherOnly.forEach(el => el.style.display = 'none');
        
        // Show elements based on role
        if (role === 'admin') {
            adminOnly.forEach(el => el.style.display = 'block');
        }
        if (role === 'teacher' || role === 'admin') {
            teacherOnly.forEach(el => el.style.display = 'block');
        }
    },

    logout() {
        AppState.currentUser = null;
        AppState.userRole = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
        
        DOM.appSection.classList.remove('active');
        DOM.authSection.style.display = 'flex';
        DOM.loginForm.reset();
        
        Utils.showToast('You have been logged out', 'info');
    }
};

// Theme Management
const Theme = {
    init() {
        if (AppState.theme === 'dark') {
            document.body.classList.add('dark');
            DOM.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
        
        DOM.themeToggle.addEventListener('click', this.toggle);
    },

    toggle() {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        
        AppState.theme = isDark ? 'dark' : 'light';
        localStorage.setItem('theme', AppState.theme);
        
        DOM.themeToggle.innerHTML = isDark ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
    }
};

// Navigation Management
const Navigation = {
    init() {
        // Page navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateTo(page);
                
                // Update active states
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Quick action buttons
        document.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.getAttribute('data-page');
                this.navigateTo(page);
            });
        });
    },

    navigateTo(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Show target page
        const targetPage = document.getElementById(page);
        if (targetPage) {
            targetPage.classList.add('active');
            AppState.currentPage = page;
            
            // Update page title
            const pageTitle = targetPage.querySelector('.page-title');
            if (pageTitle) {
                document.title = `${pageTitle.textContent} - Alkhulafau SHS`;
            }
            
            // Initialize page-specific functionality
            this.initializePage(page);
        }
    },

    initializePage(page) {
        switch(page) {
            case 'dashboard':
                Dashboard.init();
                break;
            case 'students':
                StudentsPage.init();
                break;
            case 'placements':
                PlacementsPage.init();
                break;
            case 'reports':
                ReportsPage.init();
                break;
        }
    }
};

// Dashboard Management
const Dashboard = {
    init() {
        this.updateStats();
        this.renderCharts();
        this.loadRecentActivity();
    },

    updateStats() {
        // Update student count
        document.getElementById('totalStudents').textContent = AppState.students.length;
        
        // Update teacher count
        document.getElementById('totalTeachers').textContent = AppState.teachers.length;
        
        // Calculate attendance rate
        const totalAttendance = AppState.attendance.reduce((sum, record) => 
            sum + (record.present ? 1 : 0), 0);
        const attendanceRate = AppState.attendance.length > 0 ? 
            Math.round((totalAttendance / AppState.attendance.length) * 100) : 0;
        document.getElementById('attendanceRate').textContent = `${attendanceRate}%`;
        
        // Calculate placed students
        const placedStudents = AppState.placements.filter(p => p.status === 'placed').length;
        document.getElementById('placedStudents').textContent = placedStudents;
    },

    renderCharts() {
        const ctx = document.getElementById('studentsChart');
        if (!ctx) return;

        // Sample data - replace with actual data
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Form 1', 'Form 2', 'Form 3'],
                datasets: [{
                    label: 'Students per Class',
                    data: [45, 52, 48],
                    backgroundColor: '#722f37'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    },

    loadRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        // Sample activities - replace with actual data
        const activities = [
            { type: 'student', message: 'New student registered', time: '2 hours ago' },
            { type: 'attendance', message: 'Attendance marked for Form 1', time: '4 hours ago' },
            { type: 'placement', message: '5 students placed in schools', time: '1 day ago' },
            { type: 'grade', message: 'Exam results uploaded', time: '2 days ago' }
        ];

        container.innerHTML = activities.map(activity => `
            <div style="padding: 1rem; border-bottom: 1px solid var(--light-border);">
                <div style="display: flex; justify-content: between; align-items: center;">
                    <span>${activity.message}</span>
                    <small style="color: #666;">${activity.time}</small>
                </div>
            </div>
        `).join('');
    }
};

// Students Management
const StudentsPage = {
    init() {
        this.renderStudentsTable();
        this.setupEventListeners();
    },

    renderStudentsTable() {
        const container = document.getElementById('students');
        if (!container) return;

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Student Management</h1>
                <div class="header-actions">
                    <button class="btn btn-primary" id="addStudentBtn">
                        <i class="fas fa-plus"></i> Add Student
                    </button>
                    <button class="btn btn-success" id="importStudentsBtn">
                        <i class="fas fa-upload"></i> Import
                    </button>
                    <button class="btn btn-info" id="exportStudentsBtn">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">All Students</h2>
                    <div class="search-box">
                        <input type="text" id="studentSearch" class="form-control" placeholder="Search students...">
                    </div>
                </div>
                <div class="table-container">
                    <table id="studentsTable">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Full Name</th>
                                <th>Class</th>
                                <th>Gender</th>
                                <th>Date of Birth</th>
                                <th>Parent Contact</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="studentsTableBody">
                            <!-- Students will be populated here -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Add Student Modal -->
            <div class="modal" id="addStudentModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add New Student</h3>
                        <button class="btn btn-secondary" onclick="Utils.hideModal('addStudentModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="addStudentForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Student ID</label>
                                    <input type="text" class="form-control" name="studentId" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">First Name</label>
                                    <input type="text" class="form-control" name="firstName" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Last Name</label>
                                    <input type="text" class="form-control" name="lastName" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Gender</label>
                                    <select class="form-control" name="gender" required>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Class</label>
                                    <input type="text" class="form-control" name="class" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Date of Birth</label>
                                    <input type="date" class="form-control" name="dateOfBirth" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Parent/Guardian Name</label>
                                    <input type="text" class="form-control" name="parentName">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Parent Phone</label>
                                    <input type="tel" class="form-control" name="parentPhone" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Parent Email</label>
                                    <input type="email" class="form-control" name="parentEmail">
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="Utils.hideModal('addStudentModal')">Cancel</button>
                                <button type="submit" class="btn btn-primary">Add Student</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        this.populateStudentsTable();
    },

    populateStudentsTable() {
        const tbody = document.getElementById('studentsTableBody');
        if (!tbody) return;

        tbody.innerHTML = AppState.students.map(student => `
            <tr>
                <td>${student.studentId}</td>
                <td>${student.firstName} ${student.lastName}</td>
                <td>${student.class}</td>
                <td>${student.gender}</td>
                <td>${Utils.formatDate(student.dateOfBirth)}</td>
                <td>${student.parentPhone}</td>
                <td><span class="badge badge-success">${student.status || 'Active'}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="StudentsPage.viewStudent('${student.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="StudentsPage.editStudent('${student.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="StudentsPage.deleteStudent('${student.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    setupEventListeners() {
        // Add student button
        document.getElementById('addStudentBtn')?.addEventListener('click', () => {
            Utils.showModal('addStudentModal');
        });

        // Add student form
        document.getElementById('addStudentForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddStudent();
        });

        // Search functionality
        document.getElementById('studentSearch')?.addEventListener('input', (e) => {
            this.searchStudents(e.target.value);
        });

        // Export functionality
        document.getElementById('exportStudentsBtn')?.addEventListener('click', () => {
            this.exportStudents();
        });

        // Import functionality
        document.getElementById('importStudentsBtn')?.addEventListener('click', () => {
            this.importStudents();
        });
    },

    handleAddStudent() {
        const form = document.getElementById('addStudentForm');
        const formData = new FormData(form);
        
        const student = {
            id: Utils.generateId(),
            studentId: formData.get('studentId'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            gender: formData.get('gender'),
            class: formData.get('class'),
            dateOfBirth: formData.get('dateOfBirth'),
            parentName: formData.get('parentName'),
            parentPhone: formData.get('parentPhone'),
            parentEmail: formData.get('parentEmail'),
            status: 'Active',
            createdAt: new Date().toISOString()
        };

        DataManager.students.add(student);
        this.populateStudentsTable();
        Utils.hideModal('addStudentModal');
        form.reset();
    },

    viewStudent(studentId) {
        const student = AppState.students.find(s => s.id === studentId);
        if (student) {
            // Show student details modal
            Utils.showToast(`Viewing ${student.firstName} ${student.lastName}`, 'info');
        }
    },

    editStudent(studentId) {
        const student = AppState.students.find(s => s.id === studentId);
        if (student) {
            // Show edit modal with pre-filled data
            Utils.showToast(`Editing ${student.firstName} ${student.lastName}`, 'info');
        }
    },

    deleteStudent(studentId) {
        if (confirm('Are you sure you want to delete this student?')) {
            DataManager.students.delete(studentId);
            this.populateStudentsTable();
        }
    },

    searchStudents(query) {
        const filteredStudents = AppState.students.filter(student => 
            student.studentId.toLowerCase().includes(query.toLowerCase()) ||
            student.firstName.toLowerCase().includes(query.toLowerCase()) ||
            student.lastName.toLowerCase().includes(query.toLowerCase()) ||
            student.class.toLowerCase().includes(query.toLowerCase())
        );

        const tbody = document.getElementById('studentsTableBody');
        if (tbody) {
            tbody.innerHTML = filteredStudents.map(student => `
                <tr>
                    <td>${student.studentId}</td>
                    <td>${student.firstName} ${student.lastName}</td>
                    <td>${student.class}</td>
                    <td>${student.gender}</td>
                    <td>${Utils.formatDate(student.dateOfBirth)}</td>
                    <td>${student.parentPhone}</td>
                    <td><span class="badge badge-success">${student.status || 'Active'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="StudentsPage.viewStudent('${student.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="StudentsPage.editStudent('${student.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="StudentsPage.deleteStudent('${student.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    },

    exportStudents() {
        const data = AppState.students.map(student => ({
            'Student ID': student.studentId,
            'First Name': student.firstName,
            'Last Name': student.lastName,
            'Class': student.class,
            'Gender': student.gender,
            'Date of Birth': Utils.formatDate(student.dateOfBirth),
            'Parent Phone': student.parentPhone,
            'Status': student.status
        }));

        Utils.exportToExcel(data, 'students_export');
    },

    importStudents() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls, .csv';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processImportFile(file);
            }
        };
        
        input.click();
    },

    processImportFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                
                // Process imported data
                const importedStudents = jsonData.map(row => ({
                    id: Utils.generateId(),
                    studentId: row['Student ID'] || `SHS${Utils.generateId().substr(0, 6)}`,
                    firstName: row['First Name'],
                    lastName: row['Last Name'],
                    class: row['Class'],
                    gender: row['Gender'],
                    dateOfBirth: row['Date of Birth'],
                    parentPhone: row['Parent Phone'],
                    status: 'Active',
                    createdAt: new Date().toISOString()
                }));
                
                // Add to state
                AppState.students = [...AppState.students, ...importedStudents];
                DataManager.students.save();
                this.populateStudentsTable();
                
                Utils.showToast(`Successfully imported ${importedStudents.length} students`, 'success');
            } catch (error) {
                console.error('Import error:', error);
                Utils.showToast('Error importing file', 'error');
            }
        };
        
        reader.readAsArrayBuffer(file);
    }
};

// Placements Management
const PlacementsPage = {
    init() {
        this.renderPlacementsPage();
        this.setupEventListeners();
    },

    renderPlacementsPage() {
        const container = document.getElementById('placements');
        if (!container) return;

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Student Placements</h1>
                <div class="header-actions">
                    <button class="btn btn-primary" id="addPlacementBtn">
                        <i class="fas fa-plus"></i> Add Placement
                    </button>
                    <button class="btn btn-success" id="bulkPlacementBtn">
                        <i class="fas fa-users"></i> Bulk Placement
                    </button>
                    <button class="btn btn-info" id="exportPlacementsBtn">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Placement Records</h2>
                    <div class="search-box">
                        <input type="text" id="placementSearch" class="form-control" placeholder="Search placements...">
                    </div>
                </div>
                <div class="table-container">
                    <table id="placementsTable">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>School</th>
                                <th>Program</th>
                                <th>Placement Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="placementsTableBody">
                            <!-- Placements will be populated here -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Add Placement Modal -->
            <div class="modal" id="addPlacementModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add Student Placement</h3>
                        <button class="btn btn-secondary" onclick="Utils.hideModal('addPlacementModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="addPlacementForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Student</label>
                                    <select class="form-control" name="studentId" required>
                                        <option value="">Select Student</option>
                                        ${AppState.students.map(student => 
                                            `<option value="${student.id}">${student.firstName} ${student.lastName} (${student.studentId})</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">School</label>
                                    <select class="form-control" name="schoolId" required>
                                        <option value="">Select School</option>
                                        ${AppState.schools.map(school => 
                                            `<option value="${school.id}">${school.name}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Program/Course</label>
                                    <input type="text" class="form-control" name="program" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Placement Date</label>
                                    <input type="date" class="form-control" name="placementDate" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Status</label>
                                    <select class="form-control" name="status" required>
                                        <option value="placed">Placed</option>
                                        <option value="pending">Pending</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Notes</label>
                                    <textarea class="form-control" name="notes" rows="3"></textarea>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="Utils.hideModal('addPlacementModal')">Cancel</button>
                                <button type="submit" class="btn btn-primary">Add Placement</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Search Student Placement Modal -->
            <div class="modal" id="searchPlacementModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Search Student Placement</h3>
                        <button class="btn btn-secondary" onclick="Utils.hideModal('searchPlacementModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Search by Student ID or Name</label>
                            <input type="text" id="placementSearchInput" class="form-control" placeholder="Enter student ID or name">
                        </div>
                        <button class="btn btn-primary" onclick="PlacementsPage.searchStudentPlacement()">
                            <i class="fas fa-search"></i> Search
                        </button>
                        
                        <div id="placementSearchResults" style="margin-top: 1rem;"></div>
                    </div>
                </div>
            </div>
        `;

        this.populatePlacementsTable();
    },

    populatePlacementsTable() {
        const tbody = document.getElementById('placementsTableBody');
        if (!tbody) return;

        tbody.innerHTML = AppState.placements.map(placement => {
            const student = AppState.students.find(s => s.id === placement.studentId);
            const school = AppState.schools.find(s => s.id === placement.schoolId);
            
            return `
                <tr>
                    <td>${student ? `${student.firstName} ${student.lastName}` : 'N/A'}</td>
                    <td>${school ? school.name : 'N/A'}</td>
                    <td>${placement.program}</td>
                    <td>${Utils.formatDate(placement.placementDate)}</td>
                    <td>
                        <span class="badge ${
                            placement.status === 'placed' ? 'badge-success' :
                            placement.status === 'pending' ? 'badge-warning' : 'badge-danger'
                        }">${placement.status}</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="PlacementsPage.viewPlacement('${placement.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="PlacementsPage.editPlacement('${placement.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="PlacementsPage.deletePlacement('${placement.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    setupEventListeners() {
        // Add placement button
        document.getElementById('addPlacementBtn')?.addEventListener('click', () => {
            Utils.showModal('addPlacementModal');
        });

        // Add placement form
        document.getElementById('addPlacementForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddPlacement();
        });

        // Search functionality
        document.getElementById('placementSearch')?.addEventListener('input', (e) => {
            this.searchPlacements(e.target.value);
        });

        // Export functionality
        document.getElementById('exportPlacementsBtn')?.addEventListener('click', () => {
            this.exportPlacements();
        });

        // Bulk placement
        document.getElementById('bulkPlacementBtn')?.addEventListener('click', () => {
            this.showBulkPlacementModal();
        });
    },

    handleAddPlacement() {
        const form = document.getElementById('addPlacementForm');
        const formData = new FormData(form);
        
        const placement = {
            id: Utils.generateId(),
            studentId: formData.get('studentId'),
            schoolId: formData.get('schoolId'),
            program: formData.get('program'),
            placementDate: formData.get('placementDate'),
            status: formData.get('status'),
            notes: formData.get('notes'),
            createdAt: new Date().toISOString()
        };

        DataManager.placements.add(placement);
        this.populatePlacementsTable();
        Utils.hideModal('addPlacementModal');
        form.reset();
    },

    searchStudentPlacement() {
        const searchInput = document.getElementById('placementSearchInput');
        const resultsContainer = document.getElementById('placementSearchResults');
        
        if (!searchInput || !resultsContainer) return;
        
        const query = searchInput.value.toLowerCase().trim();
        
        if (query.length < 2) {
            resultsContainer.innerHTML = '<p>Please enter at least 2 characters to search</p>';
            return;
        }
        
        // Search in students and placements
        const matchingStudents = AppState.students.filter(student => 
            student.studentId.toLowerCase().includes(query) ||
            student.firstName.toLowerCase().includes(query) ||
            student.lastName.toLowerCase().includes(query)
        );
        
        let resultsHTML = '';
        
        if (matchingStudents.length === 0) {
            resultsHTML = '<p>No students found matching your search</p>';
        } else {
            resultsHTML = matchingStudents.map(student => {
                const placement = AppState.placements.find(p => p.studentId === student.id);
                const school = placement ? AppState.schools.find(s => s.id === placement.schoolId) : null;
                
                return `
                    <div class="placement-result" style="border: 1px solid var(--light-border); padding: 1rem; margin-bottom: 1rem; border-radius: var(--radius);">
                        <h4>${student.firstName} ${student.lastName} (${student.studentId})</h4>
                        <p><strong>Class:</strong> ${student.class}</p>
                        ${placement ? `
                            <p><strong>School:</strong> ${school ? school.name : 'N/A'}</p>
                            <p><strong>Program:</strong> ${placement.program}</p>
                            <p><strong>Status:</strong> <span class="badge ${
                                placement.status === 'placed' ? 'badge-success' :
                                placement.status === 'pending' ? 'badge-warning' : 'badge-danger'
                            }">${placement.status}</span></p>
                            <p><strong>Placement Date:</strong> ${Utils.formatDate(placement.placementDate)}</p>
                        ` : `
                            <p><strong>Placement Status:</strong> <span class="badge badge-secondary">Not Placed</span></p>
                        `}
                    </div>
                `;
            }).join('');
        }
        
        resultsContainer.innerHTML = resultsHTML;
    },

    searchPlacements(query) {
        const filteredPlacements = AppState.placements.filter(placement => {
            const student = AppState.students.find(s => s.id === placement.studentId);
            const school = AppState.schools.find(s => s.id === placement.schoolId);
            
            return (
                (student && (
                    student.studentId.toLowerCase().includes(query.toLowerCase()) ||
                    student.firstName.toLowerCase().includes(query.toLowerCase()) ||
                    student.lastName.toLowerCase().includes(query.toLowerCase())
                )) ||
                (school && school.name.toLowerCase().includes(query.toLowerCase())) ||
                placement.program.toLowerCase().includes(query.toLowerCase())
            );
        });

        const tbody = document.getElementById('placementsTableBody');
        if (tbody) {
            tbody.innerHTML = filteredPlacements.map(placement => {
                const student = AppState.students.find(s => s.id === placement.studentId);
                const school = AppState.schools.find(s => s.id === placement.schoolId);
                
                return `
                    <tr>
                        <td>${student ? `${student.firstName} ${student.lastName}` : 'N/A'}</td>
                        <td>${school ? school.name : 'N/A'}</td>
                        <td>${placement.program}</td>
                        <td>${Utils.formatDate(placement.placementDate)}</td>
                        <td>
                            <span class="badge ${
                                placement.status === 'placed' ? 'badge-success' :
                                placement.status === 'pending' ? 'badge-warning' : 'badge-danger'
                            }">${placement.status}</span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-info" onclick="PlacementsPage.viewPlacement('${placement.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="PlacementsPage.editPlacement('${placement.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="PlacementsPage.deletePlacement('${placement.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    },

    exportPlacements() {
        const data = AppState.placements.map(placement => {
            const student = AppState.students.find(s => s.id === placement.studentId);
            const school = AppState.schools.find(s => s.id === placement.schoolId);
            
            return {
                'Student Name': student ? `${student.firstName} ${student.lastName}` : 'N/A',
                'Student ID': student ? student.studentId : 'N/A',
                'School': school ? school.name : 'N/A',
                'Program': placement.program,
                'Placement Date': Utils.formatDate(placement.placementDate),
                'Status': placement.status,
                'Notes': placement.notes
            };
        });

        Utils.exportToExcel(data, 'placements_export');
    },

    viewPlacement(placementId) {
        const placement = AppState.placements.find(p => p.id === placementId);
        if (placement) {
            Utils.showToast(`Viewing placement details`, 'info');
        }
    },

    editPlacement(placementId) {
        const placement = AppState.placements.find(p => p.id === placementId);
        if (placement) {
            Utils.showToast(`Editing placement`, 'info');
        }
    },

    deletePlacement(placementId) {
        if (confirm('Are you sure you want to delete this placement record?')) {
            DataManager.placements.delete(placementId);
            this.populatePlacementsTable();
        }
    },

    showBulkPlacementModal() {
        Utils.showModal('searchPlacementModal');
    }
};

// Reports Management
const ReportsPage = {
    init() {
        this.renderReportsPage();
        this.setupEventListeners();
    },

    renderReportsPage() {
        const container = document.getElementById('reports');
        if (!container) return;

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Reports & Analytics</h1>
                <div class="header-actions">
                    <button class="btn btn-primary" id="generateReportBtn">
                        <i class="fas fa-chart-bar"></i> Generate Report
                    </button>
                </div>
            </div>

            <div class="grid grid-2">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Placement Statistics</h2>
                    </div>
                    <canvas id="placementChart" height="300"></canvas>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">School Distribution</h2>
                    </div>
                    <canvas id="schoolChart" height="300"></canvas>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Placement Reports</h2>
                </div>
                <div class="table-container">
                    <table id="reportsTable">
                        <thead>
                            <tr>
                                <th>Report Type</th>
                                <th>Date Range</th>
                                <th>Generated On</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="reportsTableBody">
                            <!-- Reports will be populated here -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.renderCharts();
        this.populateReportsTable();
    },

    renderCharts() {
        // Placement Status Chart
        const placementCtx = document.getElementById('placementChart');
        if (placementCtx) {
            const statusCounts = {
                placed: AppState.placements.filter(p => p.status === 'placed').length,
                pending: AppState.placements.filter(p => p.status === 'pending').length,
                rejected: AppState.placements.filter(p => p.status === 'rejected').length
            };

            new Chart(placementCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Placed', 'Pending', 'Rejected'],
                    datasets: [{
                        data: [statusCounts.placed, statusCounts.pending, statusCounts.rejected],
                        backgroundColor: ['#27ae60', '#f39c12', '#e74c3c']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });
        }

        // School Distribution Chart
        const schoolCtx = document.getElementById('schoolChart');
        if (schoolCtx) {
            const schoolDistribution = {};
            AppState.placements.forEach(placement => {
                const school = AppState.schools.find(s => s.id === placement.schoolId);
                if (school) {
                    schoolDistribution[school.name] = (schoolDistribution[school.name] || 0) + 1;
                }
            });

            new Chart(schoolCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(schoolDistribution),
                    datasets: [{
                        label: 'Number of Students',
                        data: Object.values(schoolDistribution),
                        backgroundColor: '#722f37'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });
        }
    },

    populateReportsTable() {
        const tbody = document.getElementById('reportsTableBody');
        if (!tbody) return;

        // Sample reports data
        const reports = [
            {
                type: 'Placement Summary',
                dateRange: 'All Time',
                generatedOn: new Date().toISOString()
            },
            {
                type: 'School Performance',
                dateRange: 'Last 30 Days',
                generatedOn: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        tbody.innerHTML = reports.map(report => `
            <tr>
                <td>${report.type}</td>
                <td>${report.dateRange}</td>
                <td>${Utils.formatDate(report.generatedOn)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="ReportsPage.viewReport('${report.type}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-success" onclick="ReportsPage.exportReport('${report.type}')">
                        <i class="fas fa-download"></i> Export
                    </button>
                </td>
            </tr>
        `).join('');
    },

    setupEventListeners() {
        document.getElementById('generateReportBtn')?.addEventListener('click', () => {
            this.generateReport();
        });
    },

    generateReport() {
        // Generate comprehensive placement report
        const reportData = {
            summary: {
                totalStudents: AppState.students.length,
                placedStudents: AppState.placements.filter(p => p.status === 'placed').length,
                placementRate: Math.round((AppState.placements.filter(p => p.status === 'placed').length / AppState.students.length) * 100) || 0
            },
            bySchool: this.getPlacementsBySchool(),
            byProgram: this.getPlacementsByProgram(),
            byStatus: this.getPlacementsByStatus()
        };

        // Show report in modal or new window
        this.showReportModal(reportData);
        Utils.showToast('Report generated successfully', 'success');
    },

    getPlacementsBySchool() {
        const schoolData = {};
        AppState.placements.forEach(placement => {
            const school = AppState.schools.find(s => s.id === placement.schoolId);
            if (school) {
                if (!schoolData[school.name]) {
                    schoolData[school.name] = 0;
                }
                schoolData[school.name]++;
            }
        });
        return schoolData;
    },

    getPlacementsByProgram() {
        const programData = {};
        AppState.placements.forEach(placement => {
            if (!programData[placement.program]) {
                programData[placement.program] = 0;
            }
            programData[placement.program]++;
        });
        return programData;
    },

    getPlacementsByStatus() {
        const statusData = {
            placed: AppState.placements.filter(p => p.status === 'placed').length,
            pending: AppState.placements.filter(p => p.status === 'pending').length,
            rejected: AppState.placements.filter(p => p.status === 'rejected').length
        };
        return statusData;
    },

    showReportModal(reportData) {
        // Create and show report modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>Placement Report</h3>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="report-summary">
                        <h4>Summary</h4>
                        <div class="grid grid-3">
                            <div class="stat-card">
                                <div class="stat-value">${reportData.summary.totalStudents}</div>
                                <div class="stat-label">Total Students</div>
                            </div>
                            <div class="stat-card secondary">
                                <div class="stat-value">${reportData.summary.placedStudents}</div>
                                <div class="stat-label">Placed Students</div>
                            </div>
                            <div class="stat-card accent">
                                <div class="stat-value">${reportData.summary.placementRate}%</div>
                                <div class="stat-label">Placement Rate</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="report-details" style="margin-top: 2rem;">
                        <h4>Detailed Breakdown</h4>
                        <div class="grid grid-2">
                            <div>
                                <h5>By School</h5>
                                ${Object.entries(reportData.bySchool).map(([school, count]) => `
                                    <p>${school}: ${count} students</p>
                                `).join('')}
                            </div>
                            <div>
                                <h5>By Program</h5>
                                ${Object.entries(reportData.byProgram).map(([program, count]) => `
                                    <p>${program}: ${count} students</p>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="ReportsPage.exportDetailedReport()">
                        <i class="fas fa-download"></i> Export Full Report
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },

    viewReport(reportType) {
        Utils.showToast(`Viewing ${reportType} report`, 'info');
    },

    exportReport(reportType) {
        const data = AppState.placements.map(placement => {
            const student = AppState.students.find(s => s.id === placement.studentId);
            const school = AppState.schools.find(s => s.id === placement.schoolId);
            
            return {
                'Student Name': student ? `${student.firstName} ${student.lastName}` : 'N/A',
                'Student ID': student ? student.studentId : 'N/A',
                'School': school ? school.name : 'N/A',
                'Program': placement.program,
                'Status': placement.status,
                'Placement Date': Utils.formatDate(placement.placementDate)
            };
        });

        Utils.exportToExcel(data, `${reportType.replace(' ', '_')}_report`);
    },

    exportDetailedReport() {
        const reportData = {
            summary: {
                totalStudents: AppState.students.length,
                placedStudents: AppState.placements.filter(p => p.status === 'placed').length,
                placementRate: Math.round((AppState.placements.filter(p => p.status === 'placed').length / AppState.students.length) * 100) || 0
            },
            placements: AppState.placements.map(placement => {
                const student = AppState.students.find(s => s.id === placement.studentId);
                const school = AppState.schools.find(s => s.id === placement.schoolId);
                
                return {
                    studentName: student ? `${student.firstName} ${student.lastName}` : 'N/A',
                    studentId: student ? student.studentId : 'N/A',
                    school: school ? school.name : 'N/A',
                    program: placement.program,
                    status: placement.status,
                    placementDate: Utils.formatDate(placement.placementDate)
                };
            })
        };

        // Export as JSON or formatted Excel
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'detailed_placement_report.json';
        link.click();
        URL.revokeObjectURL(url);
        
        Utils.showToast('Detailed report exported successfully', 'success');
    }
};

// Data Management
const DataManager = {
    // Student operations
    students: {
        add(student) {
            student.id = Utils.generateId();
            student.createdAt = new Date().toISOString();
            AppState.students.push(student);
            this.save();
            Utils.showToast('Student added successfully', 'success');
        },

        update(id, updates) {
            const index = AppState.students.findIndex(s => s.id === id);
            if (index !== -1) {
                AppState.students[index] = { ...AppState.students[index], ...updates };
                this.save();
                Utils.showToast('Student updated successfully', 'success');
            }
        },

        delete(id) {
            AppState.students = AppState.students.filter(s => s.id !== id);
            this.save();
            Utils.showToast('Student deleted successfully', 'success');
        },

        save() {
            localStorage.setItem('students', JSON.stringify(AppState.students));
        }
    },

    // Placement operations
    placements: {
        add(placement) {
            placement.id = Utils.generateId();
            placement.createdAt = new Date().toISOString();
            AppState.placements.push(placement);
            this.save();
            Utils.showToast('Placement added successfully', 'success');
        },

        update(id, updates) {
            const index = AppState.placements.findIndex(p => p.id === id);
            if (index !== -1) {
                AppState.placements[index] = { ...AppState.placements[index], ...updates };
                this.save();
                Utils.showToast('Placement updated successfully', 'success');
            }
        },

        delete(id) {
            AppState.placements = AppState.placements.filter(p => p.id !== id);
            this.save();
            Utils.showToast('Placement deleted successfully', 'success');
        },

        save() {
            localStorage.setItem('placements', JSON.stringify(AppState.placements));
        }
    },

    // Initialize sample data
    initSampleData() {
        if (AppState.students.length === 0) {
            const sampleStudents = [
                {
                    id: '1',
                    studentId: 'SHS001',
                    firstName: 'Kwame',
                    lastName: 'Ampofo',
                    gender: 'Male',
                    class: 'Form 1A',
                    dateOfBirth: '2008-05-15',
                    parentPhone: '+233201234567',
                    status: 'Active'
                },
                {
                    id: '2', 
                    studentId: 'SHS002',
                    firstName: 'Ama',
                    lastName: 'Mensah',
                    gender: 'Female',
                    class: 'Form 2B',
                    dateOfBirth: '2007-08-22',
                    parentPhone: '+233241234567',
                    status: 'Active'
                },
                {
                    id: '3',
                    studentId: 'SHS003',
                    firstName: 'Kofi',
                    lastName: 'Asare',
                    gender: 'Male',
                    class: 'Form 3A',
                    dateOfBirth: '2006-11-30',
                    parentPhone: '+233271234567',
                    status: 'Active'
                }
            ];
            
            AppState.students = sampleStudents;
            this.students.save();
        }

        if (AppState.schools.length === 0) {
            const sampleSchools = [
                {
                    id: '1',
                    name: 'University of Ghana',
                    type: 'University',
                    location: 'Accra',
                    programs: ['Computer Science', 'Business Administration', 'Medicine']
                },
                {
                    id: '2',
                    name: 'KNUST',
                    type: 'University',
                    location: 'Kumasi',
                    programs: ['Engineering', 'Agriculture', 'Pharmacy']
                },
                {
                    id: '3',
                    name: 'Takoradi Technical University',
                    type: 'Technical',
                    location: 'Takoradi',
                    programs: ['Mechanical Engineering', 'Hospitality', 'ICT']
                }
            ];
            
            AppState.schools = sampleSchools;
            localStorage.setItem('schools', JSON.stringify(AppState.schools));
        }

        if (AppState.placements.length === 0) {
            const samplePlacements = [
                {
                    id: '1',
                    studentId: '1',
                    schoolId: '1',
                    program: 'Computer Science',
                    placementDate: '2024-09-01',
                    status: 'placed',
                    notes: 'Excellent academic performance'
                },
                {
                    id: '2',
                    studentId: '2',
                    schoolId: '2',
                    program: 'Engineering',
                    placementDate: '2024-09-01',
                    status: 'pending',
                    notes: 'Awaiting final approval'
                }
            ];
            
            AppState.placements = samplePlacements;
            this.placements.save();
        }
    }
};

// Application Initialization
function initApp() {
    // Initialize theme
    Theme.init();
    
    // Initialize navigation
    Navigation.init();
    
    // Check for existing session
    const savedUser = localStorage.getItem('currentUser');
    const savedRole = localStorage.getItem('userRole');
    
    if (savedUser && savedRole) {
        Auth.login(savedUser, Auth.users[savedUser].password, savedRole);
    }
    
    // Initialize sample data
    DataManager.initSampleData();
    
    // Setup login form
    DOM.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        
        Auth.login(username, password, role);
    });
    
    // Setup user avatar click
    DOM.userAvatar.addEventListener('click', () => {
        // Show user profile modal or logout option
        Utils.showToast('User profile clicked', 'info');
    });

    // Add placements to sidebar navigation
    const studentManagementSection = document.querySelector('.nav-section:nth-child(2) .nav-links');
    if (studentManagementSection) {
        const placementsLink = document.createElement('li');
        placementsLink.innerHTML = `
            <a href="#" class="nav-link" data-page="placements">
                <i class="fas fa-map-marker-alt"></i>
                <span>Student Placements</span>
            </a>
        `;
        studentManagementSection.appendChild(placementsLink);
    }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// PWA Installation
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install prompt
    Utils.showToast('Install Alkhulafau SHS App for better experience', 'info', 10000);
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => {
            console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
}

// Global functions for HTML onclick handlers
window.hideModal = Utils.hideModal;
window.StudentsPage = StudentsPage;
window.PlacementsPage = PlacementsPage;
window.ReportsPage = ReportsPage;
