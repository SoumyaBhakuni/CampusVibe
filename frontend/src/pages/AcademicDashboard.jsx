import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

// Placeholder component for student management
const ManageStudents = ({ getToken }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Manage Students</h3>
      {loading ? <p>Loading students...</p> : (
        <div className="space-y-2">
          {students.map(s => (
            <div key={s.studentId} className="bg-white/10 p-3 rounded">
              <p>{s.name} ({s.studentId})</p>
              <p className="text-sm text-gray-400">{s.email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main dashboard component
export default function AcademicDashboard() {
  const [activeTab, setActiveTab] = useState('students');
  const { getToken } = useAuth();

  const tabs = [
    { id: 'students', label: 'Students' },
    { id: 'employees', label: 'Employees' },
    { id: 'departments', label: 'Departments' },
    { id: 'courses', label: 'Courses' },
    { id: 'subjects', label: 'Subjects' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Academic Admin Dashboard</h1>

        <div className="flex space-x-2 mb-6 border-b border-white/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-6 font-semibold transition-colors ${
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
          {activeTab === 'employees' && <div>Employee Management UI will go here.</div>}
          {activeTab === 'departments' && <div>Department Management UI will go here.</div>}
          {activeTab === 'courses' && <div>Course Management UI will go here.</div>}
          {activeTab === 'subjects' && <div>Subject Management UI will go here.</div>}
        </div>
      </div>
    </div>
  );
}