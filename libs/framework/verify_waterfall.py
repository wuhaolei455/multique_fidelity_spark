import os
import yaml
from typing import Dict, Any, List

class ConfigManager:
    def __init__(self, config_file='configs/waterfall.yaml'):
        self.config_file = config_file
        self.root_dir = os.getcwd() 
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        config_path = os.path.join(self.root_dir, self.config_file)
        with open(config_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
        return config

    @property
    def paths(self) -> Dict[str, Any]:
        return self.config['paths']

    @property
    def save_dir(self) -> str:
        return os.path.join(self.root_dir, self.paths['save_dir'])

try:
    cm = ConfigManager(config_file='configs/waterfall.yaml')
    print(f"Root dir: {cm.root_dir}")
    print(f"Config save_dir: {cm.paths['save_dir']}")
    print(f"Resolved save_dir: {cm.save_dir}")
    print(f"Abs Resolved save_dir: {os.path.abspath(cm.save_dir)}")
except Exception as e:
    print(f"Error: {e}")


