import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

// ===================================================================
// --- GENERIC MODAL COMPONENT ---
// ===================================================================
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={onClose}>
    <div className="bg-slate-800 w-full max-w-2xl rounded-2xl border border-purple-500/50 p-6 shadow-xl" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-semibold">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
      </div>
      <div>
        {children}
      </div>
    </div>
  </div>
);

// ===================================================================
// --- GENERIC CRUD HANDLER FACTORY (for Frontend) ---
// ===================================================================
const useCrudHandlers = (modelName, primaryKeyField, fetchFunction, getToken, setActiveModal) => {
    
    const handleCrud = useCallback(async (data, isEdit) => {
        const token = getToken();
        const id = data[primaryKeyField];
        // Use PUT for updates (isEdit) and POST for creations
        const url = `http://localhost:5000/api/academic-admin/${modelName}${isEdit ? `/${id}` : ''}`;
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'CRUD operation failed.');
        }
        
        setActiveModal(null);
        fetchFunction();
    }, [getToken, fetchFunction, primaryKeyField, modelName, setActiveModal]);

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete this ${modelName} (${id})? This is permanent.`)) return;
        const token = getToken();
        const res = await fetch(`http://localhost:5000/api/academic-admin/${modelName}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            fetchFunction();
        } else {
            alert('Delete failed.');
        }
    };
    
    return { handleCrud, handleDelete };
};


// ===================================================================
// TAB 1: MANAGE STUDENTS (Full CRUD)
// ===================================================================
const StudentForm = ({ data, isEdit, onSubmit, onDelete }) => {
  const [formData, setFormData] = useState(data || { studentId: '', name: '', email: '', classRollNo: '', year: 1, section: '', courseId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    // courseId is now STRING, only year is INT
    setFormData(prev => ({ ...prev, [name]: name === 'year' ? parseInt(value, 10) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!formData.studentId || !formData.name || !formData.courseId || !formData.year) {
        setError('Missing required fields.');
        setLoading(false);
        return;
    }

    try {
      await onSubmit(formData, isEdit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl">{error}</div>}
      <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} placeholder="Student ID (e.g., S123)" className="input-field" required disabled={isEdit} />
      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="input-field" required />
      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="input-field" required />
      <div className="grid grid-cols-3 gap-4">
        <input type="text" name="classRollNo" value={formData.classRollNo} onChange={handleChange} placeholder="Class Roll No" className="input-field" required />
        <input type="number" name="year" value={formData.year} onChange={handleChange} placeholder="Year" className="input-field" required />
        <input type="text" name="section" value={formData.section} onChange={handleChange} placeholder="Section" className="input-field" required />
      </div>
      <input type="text" name="courseId" value={formData.courseId} onChange={handleChange} placeholder="Course ID (FK, e.g., BTCS)" className="input-field" required />
      
      <div className="flex justify-between pt-4">
        {isEdit && <button type="button" onClick={() => onDelete(formData.studentId)} disabled={loading} className="admin-button-red">Delete</button>}
        <button type="submit" disabled={loading} className={`admin-button-green ${!isEdit && 'w-full'}`}>{loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Student')}</button>
      </div>
    </form>
  );
};

const ManageStudents = ({ getToken }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    const res = await fetch('http://localhost:5000/api/academic-admin/students', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setStudents(data);
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);
  
  const { handleCrud, handleDelete } = useCrudHandlers('students', 'studentId', fetchStudents, getToken, setActiveModal);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Manage Students</h3>
      <button onClick={() => setActiveModal('create')} className="admin-button-green mb-4">+ Add New Student</button>
      {loading ? <p>Loading students...</p> : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {students.map(s => (
            <div key={s.studentId} className="bg-white/10 p-3 rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">{s.name} ({s.studentId})</p>
                <p className="text-sm text-gray-400">{s.email}</p>
                <p className="text-xs text-purple-300">C:{s.courseId} | Y:{s.year} | S:{s.section}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveModal(s)} className="admin-button">Edit</button>
                <button onClick={() => handleDelete(s.studentId)} className="admin-button-red">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {activeModal === 'create' && (
        <Modal title="Create New Student" onClose={() => setActiveModal(null)}>
          <StudentForm isEdit={false} onSubmit={handleCrud} />
        </Modal>
      )}
      {activeModal && activeModal !== 'create' && (
        <Modal title={`Edit Student ${activeModal.studentId}`} onClose={() => setActiveModal(null)}>
          <StudentForm data={activeModal} isEdit={true} onSubmit={handleCrud} onDelete={handleDelete} />
        </Modal>
      )}
    </div>
  );
};

// ===================================================================
// TAB 2: MANAGE EMPLOYEES (Full CRUD)
// ===================================================================
const EmployeeForm = ({ data, isEdit, onSubmit, onDelete }) => {
  const [formData, setFormData] = useState(data || { employeeId: '', name: '', email: '', departmentId: '', isResourceIncharge: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // departmentId is now STRING
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.employeeId || !formData.name || !formData.departmentId) {
        setError('Missing required fields.');
        setLoading(false);
        return;
    }

    try {
      await onSubmit(formData, isEdit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl">{error}</div>}
      <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} placeholder="Employee ID (e.g., E901)" className="input-field" required disabled={isEdit} />
      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="input-field" required />
      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="input-field" required />
      <input type="text" name="departmentId" value={formData.departmentId} onChange={handleChange} placeholder="Department ID (FK, e.g., CS)" className="input-field" required />
      <label className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
        <input type="checkbox" name="isResourceIncharge" checked={formData.isResourceIncharge} onChange={handleChange} className="w-5 h-5" />
        Is Resource Incharge?
      </label>
      
      <div className="flex justify-between pt-4">
        {isEdit && <button type="button" onClick={() => onDelete(formData.employeeId)} disabled={loading} className="admin-button-red">Delete</button>}
        <button type="submit" disabled={loading} className={`admin-button-green ${!isEdit && 'w-full'}`}>{loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Employee')}</button>
      </div>
    </form>
  );
};

const ManageEmployees = ({ getToken }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    const res = await fetch('http://localhost:5000/api/academic-admin/employees', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setEmployees(data);
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);
  
  const { handleCrud, handleDelete } = useCrudHandlers('employees', 'employeeId', fetchEmployees, getToken, setActiveModal);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Manage Employees</h3>
      <button onClick={() => setActiveModal('create')} className="admin-button-green mb-4">+ Add New Employee</button>
      {loading ? <p>Loading employees...</p> : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {employees.map(e => (
            <div key={e.employeeId} className="bg-white/10 p-3 rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">{e.name} ({e.employeeId})</p>
                <p className="text-sm text-gray-400">{e.email} | Dept ID: {e.departmentId}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveModal(e)} className="admin-button">Edit</button>
                <button onClick={() => handleDelete(e.employeeId)} className="admin-button-red">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {activeModal === 'create' && (
        <Modal title="Create New Employee" onClose={() => setActiveModal(null)}>
          <EmployeeForm isEdit={false} onSubmit={handleCrud} />
        </Modal>
      )}
      {activeModal && activeModal !== 'create' && (
        <Modal title={`Edit Employee ${activeModal.employeeId}`} onClose={() => setActiveModal(null)}>
          <EmployeeForm data={activeModal} isEdit={true} onSubmit={handleCrud} onDelete={handleDelete} />
        </Modal>
      )}
    </div>
  );
};


// ===================================================================
// TAB 3: MANAGE DEPARTMENTS (Full CRUD)
// ===================================================================
const DepartmentForm = ({ data, isEdit, onSubmit, onDelete }) => {
  const [formData, setFormData] = useState(data || { departmentName: '', headEmployeeId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.departmentName) {
        setError('Department Name is required.');
        setLoading(false);
        return;
    }

    try {
      await onSubmit(formData, isEdit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl">{error}</div>}
      {isEdit && <p className="text-sm text-gray-400">ID: {data.departmentId}</p>}
      <input type="text" name="departmentId" value={formData.departmentId} onChange={handleChange} placeholder="Department ID (e.g., CS)" className="input-field" required disabled={isEdit} />
      <input type="text" name="departmentName" value={formData.departmentName} onChange={handleChange} placeholder="Department Name" className="input-field" required />
      <input type="text" name="headEmployeeId" value={formData.headEmployeeId} onChange={handleChange} placeholder="Head Employee ID (optional)" className="input-field" />
      
      <div className="flex justify-between pt-4">
        {isEdit && <button type="button" onClick={() => onDelete(data.departmentId)} disabled={loading} className="admin-button-red">Delete</button>}
        <button type="submit" disabled={loading} className={`admin-button-green ${!isEdit && 'w-full'}`}>{loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Department')}</button>
      </div>
    </form>
  );
};

const ManageDepartments = ({ getToken }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    const res = await fetch('http://localhost:5000/api/academic-admin/departments', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setDepartments(data);
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);
  
  const { handleCrud, handleDelete } = useCrudHandlers('departments', 'departmentId', fetchDepartments, getToken, setActiveModal);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Manage Departments</h3>
      <button onClick={() => setActiveModal('create')} className="admin-button-green mb-4">+ Add New Department</button>
      {loading ? <p>Loading departments...</p> : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {departments.map(d => (
            <div key={d.departmentId} className="bg-white/10 p-3 rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">{d.departmentName}</p>
                <p className="text-sm text-gray-400">ID: {d.departmentId} | Head ID: {d.headEmployeeId || 'N/A'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveModal(d)} className="admin-button">Edit</button>
                <button onClick={() => handleDelete(d.departmentId)} className="admin-button-red">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {activeModal === 'create' && (
        <Modal title="Create New Department" onClose={() => setActiveModal(null)}>
          <DepartmentForm isEdit={false} onSubmit={handleCrud} />
        </Modal>
      )}
      {activeModal && activeModal !== 'create' && (
        <Modal title={`Edit Department ${activeModal.departmentId}`} onClose={() => setActiveModal(null)}>
          <DepartmentForm data={activeModal} isEdit={true} onSubmit={handleCrud} onDelete={handleDelete} />
        </Modal>
      )}
    </div>
  );
};

// ===================================================================
// TAB 4: MANAGE COURSES (Full CRUD)
// ===================================================================
const CourseForm = ({ data, isEdit, onSubmit, onDelete }) => {
  const [formData, setFormData] = useState(data || { courseName: '', departmentId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    // departmentId is now STRING
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.courseName || !formData.departmentId) {
        setError('Missing required fields.');
        setLoading(false);
        return;
    }

    try {
      await onSubmit(formData, isEdit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl">{error}</div>}
      {isEdit && <p className="text-sm text-gray-400">ID: {data.courseId}</p>}
      <input type="text" name="courseId" value={formData.courseId} onChange={handleChange} placeholder="Course ID (e.g., BTCS)" className="input-field" required disabled={isEdit} />
      <input type="text" name="courseName" value={formData.courseName} onChange={handleChange} placeholder="Course Name (e.g., B.Tech)" className="input-field" required />
      <input type="text" name="departmentId" value={formData.departmentId} onChange={handleChange} placeholder="Department ID (FK, e.g., CS)" className="input-field" required />
      
      <div className="flex justify-between pt-4">
        {isEdit && <button type="button" onClick={() => onDelete(data.courseId)} disabled={loading} className="admin-button-red">Delete</button>}
        <button type="submit" disabled={loading} className={`admin-button-green ${!isEdit && 'w-full'}`}>{loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Course')}</button>
      </div>
    </form>
  );
};

const ManageCourses = ({ getToken }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    const res = await fetch('http://localhost:5000/api/academic-admin/courses', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setCourses(data);
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);
  
  const { handleCrud, handleDelete } = useCrudHandlers('courses', 'courseId', fetchCourses, getToken, setActiveModal);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Manage Courses (Programs)</h3>
      <button onClick={() => setActiveModal('create')} className="admin-button-green mb-4">+ Add New Course</button>
      {loading ? <p>Loading courses...</p> : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {courses.map(c => (
            <div key={c.courseId} className="bg-white/10 p-3 rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">{c.courseName} (ID: {c.courseId})</p>
                <p className="text-sm text-gray-400">Department ID: {c.departmentId}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveModal(c)} className="admin-button">Edit</button>
                <button onClick={() => handleDelete(c.courseId)} className="admin-button-red">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {activeModal === 'create' && (
        <Modal title="Create New Course" onClose={() => setActiveModal(null)}>
          <CourseForm isEdit={false} onSubmit={handleCrud} />
        </Modal>
      )}
      {activeModal && activeModal !== 'create' && (
        <Modal title={`Edit Course ${activeModal.courseId}`} onClose={() => setActiveModal(null)}>
          <CourseForm data={activeModal} isEdit={true} onSubmit={handleCrud} onDelete={handleDelete} />
        </Modal>
      )}
    </div>
  );
};

// ===================================================================
// TAB 5: MANAGE SUBJECTS (Full CRUD)
// ===================================================================
const SubjectForm = ({ data, isEdit, onSubmit, onDelete }) => {
  const [formData, setFormData] = useState(data || { subjectName: '', subjectCode: '', courseId: '', year: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    // courseId is now STRING
    setFormData(prev => ({ ...prev, [name]: name === 'year' ? parseInt(value, 10) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.subjectName || !formData.subjectCode || !formData.courseId || !formData.year) {
        setError('Missing required fields.');
        setLoading(false);
        return;
    }

    try {
      await onSubmit(formData, isEdit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl">{error}</div>}
      {isEdit && <p className="text-sm text-gray-400">ID: {data.subjectId}</p>}
      <input type="text" name="subjectId" value={formData.subjectId} onChange={handleChange} placeholder="Subject ID (e.g., CS401ID)" className="input-field" required disabled={isEdit} />
      <input type="text" name="subjectName" value={formData.subjectName} onChange={handleChange} placeholder="Subject Name" className="input-field" required />
      <input type="text" name="subjectCode" value={formData.subjectCode} onChange={handleChange} placeholder="Subject Code (Unique)" className="input-field" required />
      <div className="grid grid-cols-2 gap-4">
        <input type="text" name="courseId" value={formData.courseId} onChange={handleChange} placeholder="Course ID (FK, e.g., BTCS)" className="input-field" required />
        <input type="number" name="year" value={formData.year} onChange={handleChange} placeholder="Year" className="input-field" required />
      </div>
      
      <div className="flex justify-between pt-4">
        {isEdit && <button type="button" onClick={() => onDelete(data.subjectId)} disabled={loading} className="admin-button-red">Delete</button>}
        <button type="submit" disabled={loading} className={`admin-button-green ${!isEdit && 'w-full'}`}>{loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Subject')}</button>
      </div>
    </form>
  );
};

const ManageSubjects = ({ getToken }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    const res = await fetch('http://localhost:5000/api/academic-admin/subjects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setSubjects(data);
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);
  
  const { handleCrud, handleDelete } = useCrudHandlers('subjects', 'subjectId', fetchSubjects, getToken, setActiveModal);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Manage Subjects (Classes)</h3>
      <button onClick={() => setActiveModal('create')} className="admin-button-green mb-4">+ Add New Subject</button>
      {loading ? <p>Loading subjects...</p> : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {subjects.map(s => (
            <div key={s.subjectId} className="bg-white/10 p-3 rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">{s.subjectName} ({s.subjectCode})</p>
                <p className="text-sm text-gray-400">ID: {s.subjectId} | Course ID: {s.courseId} | Year: {s.year}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveModal(s)} className="admin-button">Edit</button>
                <button onClick={() => handleDelete(s.subjectId)} className="admin-button-red">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {activeModal === 'create' && (
        <Modal title="Create New Subject" onClose={() => setActiveModal(null)}>
          <SubjectForm isEdit={false} onSubmit={handleCrud} />
        </Modal>
      )}
      {activeModal && activeModal !== 'create' && (
        <Modal title={`Edit Subject ${activeModal.subjectId}`} onClose={() => setActiveModal(null)}>
          <SubjectForm data={activeModal} isEdit={true} onSubmit={handleCrud} onDelete={handleDelete} />
        </Modal>
      )}
    </div>
  );
};


// ===================================================================
// TAB 6: MANAGE TIMETABLES (The Group) (Full CRUD)
// ===================================================================
const TimeTableForm = ({ data, isEdit, onSubmit, onDelete }) => {
  const [formData, setFormData] = useState(data || { timeTableId: '', courseId: '', year: 1, section: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    // courseId is now STRING
    setFormData(prev => ({ ...prev, [name]: name === 'year' ? parseInt(value, 10) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.timeTableId || !formData.courseId || !formData.year || !formData.section) {
        setError('Missing required fields.');
        setLoading(false);
        return;
    }

    try {
      await onSubmit(formData, isEdit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl">{error}</div>}
      {isEdit && <p className="text-sm text-gray-400">ID: {data.timeTableId}</p>}
      <input type="text" name="timeTableId" value={formData.timeTableId} onChange={handleChange} placeholder="TimeTable ID (e.g., TT01)" className="input-field" required disabled={isEdit} />
      <input type="text" name="courseId" value={formData.courseId} onChange={handleChange} placeholder="Course ID (FK, e.g., BTCS)" className="input-field" required />
      <input type="number" name="year" value={formData.year} onChange={handleChange} placeholder="Year" className="input-field" required />
      <input type="text" name="section" value={formData.section} onChange={handleChange} placeholder="Section (e.g., A or 1)" className="input-field" required />
      
      <div className="flex justify-between pt-4">
        {isEdit && <button type="button" onClick={() => onDelete(data.timeTableId)} disabled={loading} className="admin-button-red">Delete</button>}
        <button type="submit" disabled={loading} className={`admin-button-green ${!isEdit && 'w-full'}`}>{loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create TimeTable Group')}</button>
      </div>
    </form>
  );
};

const ManageTimeTables = ({ getToken }) => {
  const [timeTables, setTimeTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const fetchTimeTables = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    const res = await fetch('http://localhost:5000/api/academic-admin/timetables', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setTimeTables(data);
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    fetchTimeTables();
  }, [fetchTimeTables]);
  
  const { handleCrud, handleDelete } = useCrudHandlers('timetables', 'timeTableId', fetchTimeTables, getToken, setActiveModal);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Manage TimeTable Groups</h3>
      <p className="text-sm text-gray-400 mb-4">A TimeTable Group defines the unique Course, Year, and Section combination.</p>
      <button onClick={() => setActiveModal('create')} className="admin-button-green mb-4">+ Add New TimeTable Group</button>
      {loading ? <p>Loading TimeTables...</p> : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {timeTables.map(t => (
            <div key={t.timeTableId} className="bg-white/10 p-3 rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">ID: {t.timeTableId} | C:{t.courseId} | Y:{t.year} | S:{t.section}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveModal(t)} className="admin-button">Edit</button>
                <button onClick={() => handleDelete(t.timeTableId)} className="admin-button-red">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {activeModal === 'create' && (
        <Modal title="Create New TimeTable Group" onClose={() => setActiveModal(null)}>
          <TimeTableForm isEdit={false} onSubmit={handleCrud} />
        </Modal>
      )}
      {activeModal && activeModal !== 'create' && (
        <Modal title={`Edit TimeTable Group ${activeModal.timeTableId}`} onClose={() => setActiveModal(null)}>
          <TimeTableForm data={activeModal} isEdit={true} onSubmit={handleCrud} onDelete={handleDelete} />
        </Modal>
      )}
    </div>
  );
};


// ===================================================================
// TAB 7: MANAGE TIMETABLE ENTRIES (The Slots) (Full CRUD)
// ===================================================================
const TimeTableEntryForm = ({ data, isEdit, onSubmit, onDelete }) => {
  const [formData, setFormData] = useState(data || { entryId: '', timeTableId: '', subjectId: '', employeeId: '', day: '', timeSlot: '', roomNo: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    // all IDs are now STRING
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.timeTableId || !formData.subjectId || !formData.employeeId || !formData.day || !formData.timeSlot || !formData.entryId) {
        setError('Missing required fields.');
        setLoading(false);
        return;
    }

    try {
      await onSubmit(formData, isEdit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl">{error}</div>}
      {isEdit && <p className="text-sm text-gray-400">ID: {data.entryId}</p>}
      <input type="text" name="entryId" value={formData.entryId} onChange={handleChange} placeholder="Entry ID (e.g., TTENTRY01)" className="input-field" required disabled={isEdit} />
      <div className="grid grid-cols-2 gap-4">
        <input type="text" name="timeTableId" value={formData.timeTableId} onChange={handleChange} placeholder="TimeTable ID (FK, e.g., TT01)" className="input-field" required />
        <input type="text" name="subjectId" value={formData.subjectId} onChange={handleChange} placeholder="Subject ID (FK, e.g., CS401ID)" className="input-field" required />
      </div>
      <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} placeholder="Employee ID (Faculty, e.g., E900)" className="input-field" required />
      <div className="grid grid-cols-2 gap-4">
        <select name="day" value={formData.day} onChange={handleChange} className="input-field" required>
          <option value="">Select Day</option>
          {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
        </select>
        <input type="text" name="timeSlot" value={formData.timeSlot} onChange={handleChange} placeholder="Time Slot (e.g., 09:00-11:00)" className="input-field" required />
      </div>
      <input type="text" name="roomNo" value={formData.roomNo} onChange={handleChange} placeholder="Room No (optional)" className="input-field" />
      
      <div className="flex justify-between pt-4">
        {isEdit && <button type="button" onClick={() => onDelete(data.entryId)} disabled={loading} className="admin-button-red">Delete</button>}
        <button type="submit" disabled={loading} className={`admin-button-green ${!isEdit && 'w-full'}`}>{loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create TimeTable Slot')}</button>
      </div>
    </form>
  );
};

const ManageTimeTableEntries = ({ getToken }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    const res = await fetch('http://localhost:5000/api/academic-admin/timetable-entries', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);
  
  const { handleCrud, handleDelete } = useCrudHandlers('timetable-entries', 'entryId', fetchEntries, getToken, setActiveModal);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Manage TimeTable Slots</h3>
      <p className="text-sm text-gray-400 mb-4">These are the actual class times (e.g., TTID 1, Subject 101, Monday 9am-11am).</p>
      <button onClick={() => setActiveModal('create')} className="admin-button-green mb-4">+ Add New TimeTable Slot</button>
      {loading ? <p>Loading Entries...</p> : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {entries.map(e => (
            <div key={e.entryId} className="bg-white/10 p-3 rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">ID: {e.entryId} | {e.timeSlot} ({e.day})</p>
                <p className="text-sm text-gray-400">TTID:{e.timeTableId} | SubID:{e.subjectId} | Prof:{e.employeeId}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveModal(e)} className="admin-button">Edit</button>
                <button onClick={() => handleDelete(e.entryId)} className="admin-button-red">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {activeModal === 'create' && (
        <Modal title="Create New TimeTable Slot" onClose={() => setActiveModal(null)}>
          <TimeTableEntryForm isEdit={false} onSubmit={handleCrud} />
        </Modal>
      )}
      {activeModal && activeModal !== 'create' && (
        <Modal title={`Edit TimeTable Slot ${activeModal.entryId}`} onClose={() => setActiveModal(null)}>
          <TimeTableEntryForm data={activeModal} isEdit={true} onSubmit={handleCrud} onDelete={handleDelete} />
        </Modal>
      )}
    </div>
  );
};


// ===================================================================
// TAB 8: MANAGE RESOURCES (The Master List) (Full CRUD)
// ===================================================================
const ResourceForm = ({ data, isEdit, onSubmit, onDelete }) => {
  const [formData, setFormData] = useState(data || { resourceId: '', resourceName: '', category: '', inchargeEmployeeId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.resourceName || !formData.inchargeEmployeeId || !formData.resourceId) {
        setError('Resource ID, Name and Incharge ID are required.');
        setLoading(false);
        return;
    }

    try {
      await onSubmit(formData, isEdit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl">{error}</div>}
      {isEdit && <p className="text-sm text-gray-400">ID: {data.resourceId}</p>}
      <input type="text" name="resourceId" value={formData.resourceId} onChange={handleChange} placeholder="Resource ID (e.g., RSRC01)" className="input-field" required disabled={isEdit} />
      <input type="text" name="resourceName" value={formData.resourceName} onChange={handleChange} placeholder="Resource Name (e.g., Projector)" className="input-field" required />
      <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Category (e.g., A/V or Furniture)" className="input-field" />
      <input type="text" name="inchargeEmployeeId" value={formData.inchargeEmployeeId} onChange={handleChange} placeholder="Incharge Employee ID (FK, e.g., E900)" className="input-field" required />
      
      <div className="flex justify-between pt-4">
        {isEdit && <button type="button" onClick={() => onDelete(data.resourceId)} disabled={loading} className="admin-button-red">Delete</button>}
        <button type="submit" disabled={loading} className={`admin-button-green ${!isEdit && 'w-full'}`}>{loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Resource')}</button>
      </div>
    </form>
  );
};

const ManageResources = ({ getToken }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    // This calls the new Academic Admin Resource route
    const res = await fetch('http://localhost:5000/api/academic-admin/resources', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setResources(data);
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);
  
  const { handleCrud, handleDelete } = useCrudHandlers('resources', 'resourceId', fetchResources, getToken, setActiveModal);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Manage Event Resources (Master List)</h3>
      <p className="text-sm text-gray-400 mb-4">This list is used by organizers to request items. The Incharge ID must be a valid Employee ID.</p>
      <button onClick={() => setActiveModal('create')} className="admin-button-green mb-4">+ Add New Resource</button>
      {loading ? <p>Loading resources...</p> : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {resources.map(r => (
            <div key={r.resourceId} className="bg-white/10 p-3 rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">{r.resourceName} (ID: {r.resourceId})</p>
                <p className="text-sm text-gray-400">Category: {r.category || 'N/A'} | Incharge ID: {r.inchargeEmployeeId}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveModal(r)} className="admin-button">Edit</button>
                <button onClick={() => handleDelete(r.resourceId)} className="admin-button-red">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {activeModal === 'create' && (
        <Modal title="Create New Resource" onClose={() => setActiveModal(null)}>
          <ResourceForm isEdit={false} onSubmit={handleCrud} />
        </Modal>
      )}
      {activeModal && activeModal !== 'create' && (
        <Modal title={`Edit Resource ${activeModal.resourceId}`} onClose={() => setActiveModal(null)}>
          <ResourceForm data={activeModal} isEdit={true} onSubmit={handleCrud} onDelete={handleDelete} />
        </Modal>
      )}
    </div>
  );
};


// ===================================================================
// --- MAIN DASHBOARD COMPONENT (Updated Tabs) ---
// ===================================================================
export default function AcademicDashboard() {
  const [activeTab, setActiveTab] = useState('students');
  const { getToken } = useAuth();

  const tabs = [
    { id: 'students', label: 'Students' },
    { id: 'employees', label: 'Employees' },
    { id: 'departments', label: 'Departments' },
    { id: 'courses', label: 'Courses' },
    { id: 'subjects', label: 'Subjects' },
    { id: 'timetables', label: 'TimeTables' }, // Groups
    { id: 'timetable-entries', label: 'TimeTable Slots' }, // Entries
    { id: 'resources', label: 'Resources' }, // Resource Master List
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Academic Admin Dashboard</h1>

        <div className="flex space-x-2 mb-6 border-b border-white/10 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 py-3 px-6 font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-purple-400 text-purple-300'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          {activeTab === 'students' && <ManageStudents getToken={getToken} />}
          {activeTab === 'employees' && <ManageEmployees getToken={getToken} />}
          {activeTab === 'departments' && <ManageDepartments getToken={getToken} />}
          {activeTab === 'courses' && <ManageCourses getToken={getToken} />}
          {activeTab === 'subjects' && <ManageSubjects getToken={getToken} />}
          {activeTab === 'timetables' && <ManageTimeTables getToken={getToken} />}
          {activeTab === 'timetable-entries' && <ManageTimeTableEntries getToken={getToken} />}
          {activeTab === 'resources' && <ManageResources getToken={getToken} />}
        </div>
      </div>
    </div>
  );
}