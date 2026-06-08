import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await apiClient.getCourse(id);
        setCourse(response.course);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await apiClient.enrollCourse(user.id, id, token);
      alert('Successfully enrolled!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="course-detail-container"><p>Loading...</p></div>;
  if (error) return <div className="course-detail-container"><p className="error">{error}</p></div>;
  if (!course) return <div className="course-detail-container"><p>Course not found.</p></div>;

  return (
    <div className="course-detail-container">
      <div className="course-detail-content">
        <h1>{course.title}</h1>
        <div className="course-meta">
          <span className="meta-item"><strong>Level:</strong> {course.level}</span>
          <span className="meta-item"><strong>Category:</strong> {course.category}</span>
          <span className="meta-item"><strong>Duration:</strong> {course.duration} hours</span>
        </div>

        <div className="course-description">
          <h2>Overview</h2>
          <p>{course.description}</p>
        </div>

        {course.modules && course.modules.length > 0 && (
          <div className="course-modules">
            <h2>Course Modules</h2>
            <div className="modules-list">
              {course.modules.map((module, index) => (
                <div key={index} className="module-item">
                  <h4>{module.title}</h4>
                  <p>{module.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleEnroll} disabled={enrolling} className="enroll-btn">
          {enrolling ? 'Enrolling...' : 'Enroll in Course'}
        </button>
      </div>
    </div>
  );
};

export default CourseDetail;
