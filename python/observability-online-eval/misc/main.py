# This script tests before application exits - we automatically cleanup the logger to avoid any data loss
import logging
import uuid

import dotenv
from maxim import Maxim

logging.basicConfig(level=logging.DEBUG)

dotenv.load_dotenv()

logger = Maxim({"debug": True}).logger({})


def create_trace():
    trace = logger.trace({"id": str(uuid.uuid4()), "name": "test trace"})

    trace.event(str(uuid.uuid4()), "test event")

    span = trace.span({"id": str(uuid.uuid4()), "name": "test span"})

    span.event(str(uuid.uuid4()), "test span event")
    
    span.end()

    trace.end()
     

if __name__ == "__main__":
    create_trace()
    print("Hello, World!")
