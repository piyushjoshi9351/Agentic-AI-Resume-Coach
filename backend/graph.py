"""
LangGraph State Management and Orchestration
Defines the multi-agent workflow graph for resume analysis pipeline
"""

import logging
from typing import TypedDict, Any
from langgraph.graph import StateGraph, END

from .agents import (
    resume_analyzer_agent,
    job_matcher_agent,
    cover_letter_agent,
    interview_coach_agent
)

logger = logging.getLogger(__name__)


class AnalysisState(TypedDict, total=False):
    """
    Typed state dictionary for the analysis pipeline.
    
    Fields:
        resume_text: Raw text extracted from the PDF resume
        parsed_resume_data: Structured resume profile extracted from the resume text
        resume_data: Alias for the structured resume analysis used by downstream agents
        job_description: Raw text of the job description
        parsed_job_data: Structured job metadata parsed from URL
        resume_analysis: Structured analysis output from resume_analyzer_agent
        job_match: Job matching analysis from job_matcher_agent
        ats_result: Alias for the ATS/job match output used by interview and UI layers
        cover_letter: Generated cover letter from cover_letter_agent
        interview_questions: List of interview questions from interview_coach_agent
        user_history: Prior user analysis records and patterns available for context
    """
    resume_text: str
    parsed_resume_data: dict
    resume_data: dict
    job_description: str
    parsed_job_data: dict
    resume_analysis: dict
    job_match: dict
    ats_result: dict
    cover_letter: str
    interview_questions: list
    user_history: list


def create_analysis_graph():
    """
    Creates and compiles the multi-agent analysis workflow graph.
    
    Pipeline Flow:
    START 
        ↓
    Resume Analyzer (extracts skills, experience, education, etc.)
        ↓
    Job Matcher (calculates ATS score, matching skills, gaps)
        ↓
    Cover Letter Writer (generates personalized cover letter)
        ↓
    Interview Coach (creates interview questions with answers)
        ↓
    END
    
    Each agent receives the full state from previous agents, allowing
    context sharing and building on previous analyses.
    
    Returns:
        Compiled LangGraph StateGraph ready for execution
    """
    
    # Initialize the state graph
    workflow = StateGraph(AnalysisState)
    
    # Add nodes for each agent
    workflow.add_node("resume_analyzer", resume_analyzer_agent)
    workflow.add_node("job_matcher", job_matcher_agent)
    workflow.add_node("cover_letter_writer", cover_letter_agent)
    workflow.add_node("interview_coach", interview_coach_agent)
    
    # Set up the workflow edges (sequential pipeline)
    workflow.set_entry_point("resume_analyzer")
    
    # Define the sequence
    workflow.add_edge("resume_analyzer", "job_matcher")
    workflow.add_edge("job_matcher", "cover_letter_writer")
    workflow.add_edge("cover_letter_writer", "interview_coach")
    workflow.add_edge("interview_coach", END)
    
    # Compile the graph
    graph = workflow.compile()
    
    logger.info("Analysis graph created and compiled successfully")
    
    return graph


def visualize_graph():
    """
    Generates a visual representation of the workflow graph (for debugging).
    
    Returns:
        String representation of the graph structure
    """
    graph = create_analysis_graph()
    try:
        # This requires graphviz to be installed
        # Uncomment if you want to visualize the graph
        return graph.get_graph().draw_mermaid()
    except Exception as e:
        logger.warning(f"Could not visualize graph: {str(e)}")
        return "Graph visualization not available - graphviz not installed"


if __name__ == "__main__":
    # For testing/debugging
    logging.basicConfig(level=logging.INFO)
    
    # Create and verify graph
    graph = create_analysis_graph()
    print("Graph created successfully")
    print(f"Nodes: {list(graph.nodes)}")
    print(f"Edges: {list(graph.edges)}")
