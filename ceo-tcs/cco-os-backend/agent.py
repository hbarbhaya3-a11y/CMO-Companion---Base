import os
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_google_vertexai import ChatVertexAI
from langchain_community.utilities.sql_database import SQLDatabase
from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import tool
from app.config import settings

llm = ChatVertexAI(
    model_name=settings.GEMINI_CHAT_MODEL,
    temperature=settings.GEMINI_TEMPERATURE,
    max_output_tokens=8192,
)

@tool
def google_search(query: str) -> str:
    """Useful for when you need to answer questions about current events or get recent information from the web."""
    # Placeholder for actual Google Search implementation or Vertex Search Grounding
    # If the user has a specific Search API, they'd put it here.
    return f"Search results for {query}: [Simulated result due to missing API key]"

def get_agent(db_url: str):
    db = SQLDatabase.from_uri(db_url)
    toolkit = SQLDatabaseToolkit(db=db, llm=llm)
    tools = toolkit.get_tools() + [google_search]
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an AI-powered executive intelligence platform called CXO Companion. 
You act as a Chief of Staff powered by AI — you never sleep, read everything, forget nothing, and speak the language of executives.
You are currently tailored for Matt Guffey, Chief Commercial & Strategy Officer, UPS.
Use your SQL tool to query the database to find insights about the business. The tables have a 'tx_' prefix.
Use your Google Search tool if you need to find external competitor or market signals.
Always answer with high intellect, concise business language, citing data where possible.
"""),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad")
    ])
    
    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    return agent_executor
