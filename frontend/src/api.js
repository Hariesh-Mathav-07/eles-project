const API_BASE = 'https://eles-project.onrender.com/api';
export function getStoredToken() {
  return localStorage.getItem('eles_token');
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('eles_token', token);
  } else {
    localStorage.removeItem('eles_token');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = 'An error occurred';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text() || response.statusText;
    }
    throw new Error(errorDetail);
  }

  // Handle CSV/Blob downloads
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return response.blob();
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  register: (fullName, email, password) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name: fullName, email, password })
    }),
  getMe: () => apiRequest('/auth/me'),

  // Courses (Student / Public)
  getCourses: (search = '', category = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'All') params.append('category', category);
    return apiRequest(`/courses?${params.toString()}`);
  },
  getCategories: () => apiRequest('/courses/categories'),
  getCourseDetail: (courseId) => apiRequest(`/courses/${courseId}`),
  enrollCourse: (courseId) => apiRequest(`/courses/${courseId}/enroll`, { method: 'POST' }),
  unenrollCourse: (courseId) => apiRequest(`/courses/${courseId}/unenroll`, { method: 'POST' }),
  getMyCourses: () => apiRequest('/student/my-courses'),
  getCourseMaterials: (courseId) => apiRequest(`/courses/${courseId}/materials`),
  updateCourseProgress: (courseId, progress) =>
    apiRequest(`/student/courses/${courseId}/progress?progress=${progress}`, { method: 'PUT' }),

  // Quizzes & Results
  getQuiz: (quizId) => apiRequest(`/quizzes/${quizId}`),
  submitQuiz: (quizId, answers) =>
    apiRequest(`/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    }),
  getMyResults: () => apiRequest('/student/my-results'),

  // Teacher Endpoints
  getTeacherCourses: () => apiRequest('/teacher/my-courses'),
  createCourse: (courseData) =>
    apiRequest('/teacher/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    }),
  updateCourse: (courseId, courseData) =>
    apiRequest(`/teacher/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(courseData)
    }),
  addMaterial: (courseId, materialData) =>
    apiRequest(`/courses/${courseId}/materials`, {
      method: 'POST',
      body: JSON.stringify(materialData)
    }),
  deleteMaterial: (materialId) =>
    apiRequest(`/materials/${materialId}`, { method: 'DELETE' }),
  createQuiz: (courseId, quizData) =>
    apiRequest(`/courses/${courseId}/quizzes`, {
      method: 'POST',
      body: JSON.stringify(quizData)
    }),
  getTeacherSubmissions: () => apiRequest('/teacher/all-submissions'),

  // Admin Endpoints
  getAdminUsers: (role = '', search = '') => {
    const params = new URLSearchParams();
    if (role && role !== 'All') params.append('role', role);
    if (search) params.append('search', search);
    return apiRequest(`/admin/users?${params.toString()}`);
  },
  createAdminUser: (userData) =>
    apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
  updateUserStatus: (userId, isActive) =>
    apiRequest(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive })
    }),
  updateUserRole: (userId, role) =>
    apiRequest(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),
  deleteUser: (userId) =>
    apiRequest(`/admin/users/${userId}`, { method: 'DELETE' }),
  getAdminCourses: () => apiRequest('/admin/courses'),
  toggleCoursePublish: (courseId) =>
    apiRequest(`/admin/courses/${courseId}/publish`, { method: 'PUT' }),
  adminDeleteCourse: (courseId) =>
    apiRequest(`/admin/courses/${courseId}`, { method: 'DELETE' }),

  // Reports Endpoints
  getOverviewStats: () => apiRequest('/reports/overview'),
  getEnrollmentReports: () => apiRequest('/reports/enrollments'),
  getQuizPerformanceReports: () => apiRequest('/reports/quiz-performance'),
  exportCsvReport: () => apiRequest('/reports/export-csv')
};
