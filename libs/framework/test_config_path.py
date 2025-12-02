import os
import sys
from manager.config_manager import ConfigManager

# Simulate arguments
class Args:
    def __init__(self):
        self.config = '/app/holly/config/test.yaml' # Simulate the path
        self.opt = 'MFES_SMAC'
        self.log_level = 'info'
        self.iter_num = 10
        self.R = 27
        self.eta = 3
        self.history_dir = None
        self.save_dir = '../../holly/result' # Simulate the override from start.sh
        self.target = 'tpcds_100g'
        self.compress = 'shap'
        self.cp_topk = 40
        self.warm_start = 'none'
        self.ws_init_num = 4
        self.ws_topk = 4
        self.ws_inner_surrogate_model = 'prf'
        self.transfer = 'none'
        self.tl_topk = 3
        self.backup_flag = False
        self.task = 'test'
        self.seed = 42
        self.rand_prob = 0.15
        self.rand_mode = 'ran'
        self.test_mode = True
        self.debug = False
        self.resume = None
        self.space = None

# Create a dummy config file
os.makedirs('/app/holly/config', exist_ok=True)
with open('/app/holly/config/test.yaml', 'w') as f:
    f.write("""
paths:
  save_dir: ../../holly/result
""")

args = Args()
cm = ConfigManager(config_file=args.config, args=args)
print(f"Root dir: {cm.root_dir}")
print(f"Config save_dir (raw): {cm.paths.get('save_dir')}")
print(f"Resolved save_dir: {cm.save_dir}")
print(f"Abs Resolved save_dir: {os.path.abspath(cm.save_dir)}")

