import json
import logging
import os
import time

from maxim.maxim import Config, Maxim
from maxim.models.dataset import VariableType
from maxim.models.queryBuilder import QueryBuilder

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


# get environment variables
api_key = os.environ["MAXIM_API_KEY"]
env = "beta" #os.environ["ENV"]
intent_detector_prompt_id = os.environ["INTENT_DETECTOR_PROMPT_ID"]

# setting up maxim
config = Config(apiKey=api_key, debug=True)
maxim = Maxim(config=config)


def getPromptForTenantId(tenantId):
    rule = QueryBuilder().and_().deploymentVar(
        "env", env).deploymentVar("tenant-id", tenantId, False).build()
    return maxim.getPrompt(intent_detector_prompt_id, rule=rule)


if __name__ == "__main__":
    prompt = getPromptForTenantId("123")
    print(prompt.__dict__)
