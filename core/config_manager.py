import json
import os

CONFIG_FILE = "config.json"

class ConfigManager:
    """
    Manages application configuration in a local JSON file.
    Settings: openai_api_key, openai_model, apps_script_url
    """
    
    @staticmethod
    def load_config() -> dict:
        if not os.path.exists(CONFIG_FILE):
            return {
                "openai_api_key": "",
                "openai_model": "gpt-4o-mini",
                "apps_script_url": ""
            }
        
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[ConfigManager] Error loading config: {e}")
            return {}

    @staticmethod
    def save_config(config_data: dict):
        try:
            # Ensure we don't accidentally wipe settings if config_data is incomplete
            current = ConfigManager.load_config()
            current.update(config_data)
            
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(current, f, indent=4, ensure_ascii=False)
            print("[ConfigManager] Config saved successfully.")
        except Exception as e:
            print(f"[ConfigManager] Error saving config: {e}")

    @staticmethod
    def get_setting(key: str, default=None):
        config = ConfigManager.load_config()
        return config.get(key, default)
