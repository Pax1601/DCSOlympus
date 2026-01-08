from api import API
from atc.agency.base import Base
import logging

from atc.agency.ground import Ground
from atc.agency.tower import Tower
from atc.agency.approach import Approach

class Airbase:
    def __init__(self, name, config: dict, api: API, logger: logging.Logger):
        self.name = name
        self.api = api
        self.logger = logger
        
        self.logger.info(f"Initializing Airbase: {name}")
        
        # Initialize components to None
        self.atis = None
        self.base = None
        self.ground = None
        self.tower = None
        self.approach = None
        
        # Check if the config has a "atis" section
        self.atis_config = config.get("atis", None)
        if self.atis_config:
            pass
            #TODO self.atis = ATIS(name + " ATIS", self.atis_config, api, logger)
            
        # Check if the config has a "base" section
        self.base_config = config.get("base", None)
        if self.base_config:
            self.base = Base(name + " Base", self.base_config, api, logger)
            
        # Check if the config has a "ground" section
        self.ground_config = config.get("ground", None)
        if self.ground_config:
            self.ground = Ground(name + " Ground", self.ground_config, api, logger)
            
        # Check if the config has a "tower" section
        self.tower_config = config.get("tower", None)
        if self.tower_config:
            self.tower = Tower(name + " Tower", self.tower_config, api, logger)
            
        # Check if the config has an "approach" section
        self.approach_config = config.get("approach", None)
        if self.approach_config:
            self.approach = Approach(name + " Approach", self.approach_config, api, logger)