import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from config import settings

# Silence noisy background topology maintenance logs
logging.getLogger("pymongo").setLevel(logging.WARNING)
logger = logging.getLogger('engine.db')

class Database:
    client: MongoClient = None
    db = None

    @classmethod
    def connect(cls):
        if cls.client is not None:
            return cls.db

        logger.info(f"Connecting to MongoDB Atlas [{settings.DB_NAME}]...")
        try:
            cls.client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=20000,
                socketTimeoutMS=20000,
                maxPoolSize=20,
                minPoolSize=0,  # Avoid background eager pre-allocation on replica shards
                retryWrites=True,
            )
            # Ping database to confirm live connectivity
            cls.client.admin.command('ping')
            cls.db = cls.client[settings.DB_NAME]
            logger.info("Successfully connected to MongoDB Atlas!")
            return cls.db
        except (ConnectionFailure, ServerSelectionTimeoutError) as err:
            logger.error(f"MongoDB connection failed: {err}")
            raise err

    @classmethod
    def get_db(cls):
        if cls.db is None:
            return cls.connect()
        return cls.db

    @classmethod
    def close(cls):
        if cls.client is not None:
            cls.client.close()
            cls.client = None
            cls.db = None
            logger.info("MongoDB connection closed.")

# Convenient collection accessors
def get_projects_collection():
    return Database.get_db()['projects']

def get_tasks_collection():
    return Database.get_db()['tasks']

def get_commits_collection():
    return Database.get_db()['commits']

def get_users_collection():
    return Database.get_db()['users']
