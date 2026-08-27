import os

from dotenv import load_dotenv
from sqlalchemy import create_engine


# Load environment variables from project-root .env
load_dotenv()


DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not configured. "
        "Create a .env file in the project root."
    )


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    future=True,
)