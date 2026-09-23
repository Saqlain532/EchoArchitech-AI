import os
from pathlib import Path
from dotenv import load_dotenv

# Dynamically locate engine/.env regardless of execution directory
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

class Settings:
    PORT: int = int(os.getenv('PORT', 8000))
    HOST: str = os.getenv('HOST', '0.0.0.0')
    MONGODB_URI: str = os.getenv(
        'MONGODB_URI',
        'mongodb+srv://saqlainmustaque532_db_user:WuZrI1actb2wNs31@cluster0.nbxnay6.mongodb.net'
    )
    DB_NAME: str = os.getenv('DB_NAME', 'echoarchitect')
    WEBHOOK_SECRET: str = os.getenv('WEBHOOK_SECRET', 'echoarchitect_secret_2026')
    CLIENT_URL: str = os.getenv('CLIENT_URL', 'http://localhost:5173')
    GATEWAY_URL: str = os.getenv('GATEWAY_URL', 'http://localhost:5000')

settings = Settings()
