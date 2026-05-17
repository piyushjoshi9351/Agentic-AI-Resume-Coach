from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from agents import (
    cover_letter_agent,
    interview_coach_agent,
    job_matcher_agent,
    resume_analyzer_agent,
)


class ResumeState(TypedDict):
    resume_text: str
    job_description: str
    resume_analysis: str
    job_match: str
    cover_letter: str
    interview_questions: str


def build_graph():
    graph = StateGraph(ResumeState)

    graph.add_node("resume_analyzer", resume_analyzer_agent)
    graph.add_node("job_matcher", job_matcher_agent)
    graph.add_node("cover_letter_writer", cover_letter_agent)
    graph.add_node("interview_coach", interview_coach_agent)

    graph.add_edge(START, "resume_analyzer")
    graph.add_edge("resume_analyzer", "job_matcher")
    graph.add_edge("job_matcher", "cover_letter_writer")
    graph.add_edge("cover_letter_writer", "interview_coach")
    graph.add_edge("interview_coach", END)

    return graph.compile()
