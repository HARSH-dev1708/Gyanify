# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List

# --- 1. IMPORT YOUR AI AGENT ---
from gyanify.agents.content_agent import create_content_agent

# --- 2. CREATE YOUR FASTAPI APP ---
app = FastAPI(
    title="Gyanify API",
    description="The backend server for the Gyanify platform."
)

# --- 3. DEFINE THE DATA "CONTRACTS" ---
# This tells the API what data to *expect* from the Frontend
class ContentRequest(BaseModel):
    topic: str = Field(..., description="The topic for the lesson, e.g., 'Photosynthesis'")
    grade_level: str = Field(..., description="The target grade, e.g., '9th Grade'")

# This tells the API what data it will *send back*
class ContentResponse(BaseModel):
    lesson_plan: str
    quiz: List[dict] # A list of quiz question objects
    worksheet: str

# --- 4. CREATE THE API "HEALTH CHECK" ENDPOINT ---
@app.get("/")
def read_root():
    """A simple endpoint to check if the server is running."""
    return {"status": "Gyanify API is running!"}

# --- 5. CREATE THE CONTENT GENERATION ENDPOINT ---
@app.post("/api/v1/generate/content", response_model=ContentResponse)
async def handle_content_generation(request: ContentRequest):
    """
    This is the main endpoint that the Frontend will call.
    It takes a topic and grade level, calls your AI agent,
    and returns the generated content.
    """
    print(f"Received new request: Topic={request.topic}, Grade={request.grade_level}")
    
    try:
        # --- THIS IS THE MAGIC MOMENT ---
        # Call the LangGraph agent you already built!
        generated_content = create_content_agent(
            topic=request.topic,
            grade_level=request.grade_level
        )
        
        # Return the content to the frontend
        return generated_content
        
    except Exception as e:
        # If your agent fails for any reason, send a clear error to the frontend
        print(f"Error during agent execution: {e}")
        raise HTTPException(
            status_code=500, # 500 = Internal Server Error
            detail=f"An error occurred while generating content: {e}"
        )

# --- 6. (Optional) Add CORS for Frontend ---
# This is needed so your React app (on a different "origin") can talk to this server
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change this to your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)