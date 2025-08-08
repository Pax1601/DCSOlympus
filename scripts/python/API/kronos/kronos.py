# Setup a logger for the module
import logging
logger = logging.getLogger("Kronos")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('[%(asctime)s] %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

class Kronos():
    def __init__(self, api):
        self.api = api
        
    def on_startup(self):
        logger.info("Kronos API started")
        