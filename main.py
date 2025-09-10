from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import json
from agno.agent import Agent
from agno.models.google import Gemini
from agno.tools.duckduckgo import DuckDuckGoTools

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = Agent(
    model=Gemini(
        id="gemini-2.5-flash", api_key="AIzaSyCycLxmgdGGW35fZ3cOORx7ck90Tooa12Y"
    ),
    tools=[DuckDuckGoTools()],
    show_tool_calls=True,
    markdown=True,
)


@app.get("/api/chat")
async def chat(prompt: str):
    def event_generator():
        for event in agent.run(prompt, stream=True, stream_intermediate_steps=True):
            event_name = event.__class__.__name__
            data = {}

            # Run start/complete
            if event_name in ["RunResponseStartedEvent", "RunResponseCompletedEvent"]:
                data = {
                    "type": "run",
                    "event": event.event,
                    "run_id": event.run_id,
                    "created_at": event.created_at,
                    "model": getattr(event, "model", None),
                }
                yield f"event: run\ndata: {json.dumps(data)}\n\n"

            # Content chunks (typing effect)
            elif event_name == "RunResponseContentEvent":
                data = {
                    "type": "message.delta",
                    "content": event.content,
                    "content_type": event.content_type,
                }
                yield f"event: message\ndata: {json.dumps(data)}\n\n"

            # Tool events
            elif event_name.startswith("ToolCall"):
                data = {
                    "type": "tool",
                    "event": event.event,
                    "tool": {
                        "name": event.tool.tool_name if event.tool else None,
                        "args": event.tool.tool_args if event.tool else None,
                        "result": getattr(event.tool, "result", None),
                    },
                }
                yield f"event: tool\ndata: {json.dumps(data)}\n\n"

            # Fallback (log)
            else:
                yield f"event: log\ndata: {json.dumps({'raw': str(event)})}\n\n"

        # End of stream marker
        yield "event: end\ndata: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


app.mount("/", StaticFiles(directory="static", html=True), name="static")
