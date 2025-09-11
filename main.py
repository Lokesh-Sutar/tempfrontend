import asyncio
import json
import logging
from dataclasses import asdict, is_dataclass

from agno.agent import Agent
from agno.models.google import Gemini
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.googlesearch import GoogleSearchTools
from agno.tools.yfinance import YFinanceTools
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from prompt import SYSTEM_PROMPT

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)
logger = logging.getLogger(__name__)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


agent = Agent(
    model=Gemini(
        api_key='AIzaSyCycLxmgdGGW35fZ3cOORx7ck90Tooa12Y', system_prompt=SYSTEM_PROMPT
    ),
    tools=[
        DuckDuckGoTools(cache_results=True, fixed_max_results=10),
        YFinanceTools(cache_results=True),
        GoogleSearchTools(cache_results=True, fixed_max_results=10),
    ],
)


def event_to_dict(event) -> dict:
    """
    Intelligently converts an event object to a dictionary, handling dataclasses.
    """
    if hasattr(event, 'to_dict'):
        return event.to_dict()
    if is_dataclass(event):
        return asdict(event)  # type: ignore
    return vars(event)


def process_event(event) -> str:
    """
    Processes any event, serializes its data, categorizes it, and formats it
    as a Server-Sent Event (SSE) string. This is the core of the new design.
    """
    event_name = event.__class__.__name__
    logger.info(f'Processing event: {event_name}')

    payload = event_to_dict(event)

    if event_name == 'RunCompletedEvent':
        if 'metrics' in payload:
            logger.info("--- AGENT RUN COMPLETED ---")
            metrics_json = json.dumps(payload['metrics'], indent=2)
            logger.info(f"Final Metrics:\n{metrics_json}")
            logger.info("---------------------------")

    cleaned_payload = {}
    for key, value in payload.items():
        if key.startswith('_'):
            continue
        if isinstance(value, (logging.Logger, object)) and key == 'timer':
            continue
        cleaned_payload[key] = value

    if (
        'tool' in cleaned_payload
        and cleaned_payload['tool']
        and 'result' in cleaned_payload['tool']
    ):
        tool_result = cleaned_payload['tool']['result']
        if isinstance(tool_result, str):
            try:
                cleaned_payload['tool']['result'] = json.loads(tool_result)
            except (json.JSONDecodeError, TypeError):
                pass

    if 'Tool' in event_name:
        event_type = 'tool'
    elif 'Content' in event_name:
        event_type = 'content'
    elif 'Reasoning' in event_name:
        event_type = 'reasoning'
    elif 'Run' in event_name:
        event_type = 'run'
    else:
        event_type = 'log'

    sse_data = {
        'type': event_type,
        'event': cleaned_payload.pop('event', event_name),
        'meta': {
            'runId': cleaned_payload.pop('run_id', None),
            'sessionId': cleaned_payload.pop('session_id', None),
        },
        'payload': cleaned_payload,
    }

    json_data = json.dumps(sse_data)
    logger.debug(f'Sending to frontend: {json_data}')
    return f'event: {event_type}\ndata: {json_data}\n\n'


@app.get('/')
async def root():
    return {'message': 'The server is running.'}


@app.get('/api/chat')
async def chat(prompt: str):
    """
    Handles chat requests by streaming processed agent events.
    The main logic is now encapsulated in the `process_event` function.
    """

    async def event_generator():
        logger.info(f"Starting agent run for prompt: '{prompt[:50]}...'")
        try:
            async for event in await agent.arun(
                prompt, stream=True, stream_intermediate_steps=True
            ):
                yield process_event(event)
                await asyncio.sleep(0.01)

            end_event_data = json.dumps({'message': 'RunCompleted'})
            yield f'event: end\ndata: {end_event_data}\n\n'
            logger.info('Agent run completed successfully.')

        except Exception as e:
            logger.error(f'An error occurred during agent execution: {e}', exc_info=True)
            error_data = json.dumps({'error': str(e)})
            yield f'event: error\ndata: {error_data}\n\n'

    return StreamingResponse(event_generator(), media_type='text/event-stream')
