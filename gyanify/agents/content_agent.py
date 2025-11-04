# gyanify/agents/content_agent.py
import os
import json
from typing import TypedDict, List
from langchain_core.messages import HumanMessage, AIMessage
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

# --- 1. Load API Key ---
load_dotenv()
if not os.getenv("GROQ_API_KEY"):
    raise ValueError("GROQ_API_KEY not found. Please set it in your .env file.")

# --- 2. Define the State (The Agent's "Memory") ---
class ContentGenerationState(TypedDict):
    """A blueprint for our agent's memory."""
    topic: str
    grade_level: str
    lesson_plan: str    # This will be filled by Specialist 1
    quiz: List[dict]  # This will be filled by Specialist 2
    worksheet: str        # This will be filled by Specialist 3

# --- 3. Initialize the LLM (The "Brain" for all specialists) ---
llm = ChatGroq(temperature=0, model_name="llama-3.3-70b-versatile")

# --- 4. Define Your Specialist Nodes ---

# Specialist 1: Lesson Planner
def node_lesson_planner(state: ContentGenerationState) -> dict:
    print("--- CALLING LESSON PLANNER ---")
    prompt = ChatPromptTemplate.from_template(
        "You are an expert curriculum designer for {grade_level}. "
        "Create a comprehensive, 45-minute lesson plan for the topic: {topic}. "
        "Include objectives, materials, and a step-by-step procedure."
    )
    chain = prompt | llm
    response = chain.invoke({
        "grade_level": state["grade_level"],
        "topic": state["topic"]
    })
    return {"lesson_plan": response.content}

# Specialist 2: Quiz Generator
def node_quiz_generator(state: ContentGenerationState) -> dict:
    print("--- CALLING QUIZ GENERATOR ---")
    lesson_plan = state["lesson_plan"] # Uses the work from the previous specialist!
    
    prompt = ChatPromptTemplate.from_template(
        "You are a quiz creator. Based on this lesson plan:\n\n{lesson_plan}\n\n"
        "Create a 5-question multiple-choice quiz. "
        "Return *only* a valid JSON list of objects. "
        "Each object must have 'question', 'options' (a list), and 'answer' (a string)."
    )
    chain = prompt | llm
    response = chain.invoke({"lesson_plan": lesson_plan})
    
    try:
        # Try to clean and load the JSON
        quiz_json = json.loads(response.content.strip("`json\n"))
        return {"quiz": quiz_json}
    except json.JSONDecodeError:
        print("Quiz Generator failed to produce valid JSON.")
        return {"quiz": []}

# Specialist 3: Worksheet Generator
def node_worksheet_generator(state: ContentGenerationState) -> dict:
    print("--- CALLING WORKSHEET GENERATOR ---")
    lesson_plan = state["lesson_plan"] # Also uses the plan
    
    prompt = ChatPromptTemplate.from_template(
        "You are a worksheet creator. Based on this lesson plan:\n\n{lesson_plan}\n\n"
        "Create a 10-question 'fill-in-the-blanks' worksheet. "
        "Provide the questions, and a separate answer key at the bottom."
    )
    chain = prompt | llm
    response = chain.invoke({"lesson_plan": lesson_plan})
    return {"worksheet": response.content}

# --- 5. Assemble the Graph (The "Flowchart") ---
workflow = StateGraph(ContentGenerationState)

# Add the three "specialists" as nodes
workflow.add_node("lesson_planner", node_lesson_planner)
workflow.add_node("quiz_generator", node_quiz_generator)
workflow.add_node("worksheet_generator", node_worksheet_generator)

# Set the "starting" point
workflow.set_entry_point("lesson_planner")

# Add the "arrows"
workflow.add_edge("lesson_planner", "quiz_generator")
workflow.add_edge("quiz_generator", "worksheet_generator")
workflow.add_edge("worksheet_generator", END) # The last step goes to END

# "Compile" the flowchart into a runnable app
content_agent_app = workflow.compile()

# --- 6. Create the Final Wrapper Function ---
def create_content_agent(topic: str, grade_level: str) -> dict:
    """
    Runs the full content generation agent.
    
    Args:
        topic: The topic for the lesson (e.g., "Photosynthesis").
        grade_level: The target grade (e.g., "9th Grade").
        
    Returns:
        A dictionary with 'lesson_plan', 'quiz', and 'worksheet'.
    """
    # This is the "work order" we start with
    initial_state = {
        "topic": topic,
        "grade_level": grade_level,
        "lesson_plan": "",
        "quiz": [],
        "worksheet": "",
    }
    
    # Run the agent from start to finish
    final_state = content_agent_app.invoke(initial_state)
    
    # Return the final package
    return {
        "lesson_plan": final_state["lesson_plan"],
        "quiz": final_state["quiz"],
        "worksheet": final_state["worksheet"]
    }

# --- 7. Local Testing ---
if __name__ == "__main__":
    print("Testing Content Generation Agent...")
    content = create_content_agent("The Water Cycle", "5th Grade Science")
    
    print("\n\n--- FINAL LESSON PLAN ---")
    print(content["lesson_plan"])
    
    print("\n\n--- FINAL QUIZ (JSON) ---")
    print(json.dumps(content["quiz"], indent=2))
    
    print("\n\n--- FINAL WORKSHEET ---")
    print(content["worksheet"])