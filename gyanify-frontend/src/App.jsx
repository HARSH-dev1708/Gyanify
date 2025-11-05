// gyanify-frontend/src/App.jsx

import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; 

// This is the URL of Harsh's backend server
const API_URL = "http://127.0.0.1:8000/api/v1/generate/content";

function App() {
  // --- 1. React's "Memory" (called "State") ---
  const [topic, setTopic] = useState("Photosynthesis");
  const [gradeLevel, setGradeLevel] = useState("9th Grade");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // For the final AI output
  const [lessonPlan, setLessonPlan] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [worksheet, setWorksheet] = useState("");
  
  // --- NEW STATE FOR TABS ---
  // This will store which tab is currently selected.
  // We'll default it to 'lessonPlan'
  const [activeTab, setActiveTab] = useState('lessonPlan'); 

  // --- 2. The API Call Function ---
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setIsLoading(true); 
    setError(null);
    setLessonPlan("");
    setQuiz([]);
    setWorksheet("");
    
    // Set the default tab to show when results load
    setActiveTab('lessonPlan'); 

    try {
      const response = await axios.post(API_URL, {
        topic: topic,
        grade_level: gradeLevel 
      });
      
      // Save the response data
      setLessonPlan(response.data.lesson_plan);
      setQuiz(response.data.quiz);
      setWorksheet(response.data.worksheet);

    } catch (err) {
      setError("An error occurred. Is the backend server (uvicorn) running?");
    } finally {
      setIsLoading(false); 
    }
  };

  // --- 3. The HTML (called "JSX") ---
  return (
    <div className="app-container">
      <header>
        <h1>Gyanify Content Generator</h1>
      </header>

      <main>
        {/* --- This is the Form --- */}
        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-group">
            <label>Topic:</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label>Grade Level:</label>
            <input 
              type="text" 
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)} 
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate Content"}
          </button>
        </form>
        
        {/* Show an error message if one exists */}
        {error && <div className="error-message">{error}</div>}
        
        {/* --- UPDATED RESULTS AREA WITH TABS --- */}
        <div className="results-container">
          
          {/* Only show the tabs *after* a lesson plan has been generated */}
          {lessonPlan && (
            <div className="result-card">
              {/* --- TAB BUTTONS --- */}
              <div className="tab-buttons">
                <button 
                  className={`tab-button ${activeTab === 'lessonPlan' ? 'active' : ''}`}
                  onClick={() => setActiveTab('lessonPlan')}
                >
                  Lesson Plan
                </button>
                <button 
                  className={`tab-button ${activeTab === 'quiz' ? 'active' : ''}`}
                  onClick={() => setActiveTab('quiz')}
                >
                  Quiz
                </button>
                <button 
                  className={`tab-button ${activeTab === 'worksheet' ? 'active' : ''}`}
                  onClick={() => setActiveTab('worksheet')}
                >
                  Worksheet
                </button>
              </div>

              {/* --- TAB CONTENT --- */}
              <div className="tab-content">
                {/* Show Lesson Plan Content */}
                {activeTab === 'lessonPlan' && (
                  <div>
                    <h2>Lesson Plan</h2>
                    <pre>{lessonPlan}</pre> 
                  </div>
                )}
                
                {/* Show Quiz Content */}
                {activeTab === 'quiz' && (
                  <div>
                    <h2>Quiz</h2>
                    {quiz.map((q, index) => (
                      <div key={index} className="quiz-question">
                        <p><strong>{index + 1}. {q.question}</strong></p>
                        <ul>
                          {q.options.map((opt, i) => <li key={i}>{opt}</li>)}
                        </ul>
                        <p><em>Answer: {q.answer}</em></p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Show Worksheet Content */}
                {activeTab === 'worksheet' && (
                  <div>
                    <h2>Worksheet</h2>
                    <pre>{worksheet}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;