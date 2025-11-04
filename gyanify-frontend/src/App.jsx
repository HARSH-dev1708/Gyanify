// gyanify-frontend/src/App.jsx

import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; 

// URL of Harsh's backend server
const API_URL = "http://127.0.0.1:8000/api/v1/generate/content";

function App() {
  // 1. --- React's "Memory" (called "State") ---
  // We use 'useState' to store data that can change.
  const [topic, setTopic] = useState("Photosynthesis");
  const [gradeLevel, setGradeLevel] = useState("9th Grade");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lessonPlan, setLessonPlan] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [worksheet, setWorksheet] = useState("");

  // --- 2. The API Call Function ---
  // This function runs when the user clicks the "Generate" button
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stops the page from reloading
    setIsLoading(true); // Show a "loading..." message
    setError(null);
    setLessonPlan("");
    setQuiz([]);
    setWorksheet("");

    try {
      // This is the "bridge" to the backend!
      const response = await axios.post(API_URL, {
        topic: topic,
        grade_level: gradeLevel 
      });

      // The API call was a success! Save the response
      setLessonPlan(response.data.lesson_plan);
      setQuiz(response.data.quiz);
      setWorksheet(response.data.worksheet);

    } catch (err) {
      setError("An error occurred. Is the backend server (uvicorn) running?");
    } finally {
      setIsLoading(false); // Hide the "loading..." message
    }
  };

  // --- 3. The HTML (called "JSX") ---
  // This is what React will render on the page.
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

        {/* --- This is the Output Area --- */}
        <div className="results-container">

          {lessonPlan && (
            <div className="result-card">
              <h2>Lesson Plan</h2>
              <pre>{lessonPlan}</pre> 
            </div>
          )}

          {quiz.length > 0 && (
            <div className="result-card">
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

          {worksheet && (
            <div className="result-card">
              <h2>Worksheet</h2>
              <pre>{worksheet}</pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;