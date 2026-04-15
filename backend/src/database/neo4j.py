import os
import logging
from neo4j import AsyncGraphDatabase

logger = logging.getLogger(__name__)

URI = f"bolt://{os.getenv('NEO4J_HOST', 'neo4j')}:{os.getenv('NEO4J_PORT', '7687')}"
USER = os.getenv("NEO4J_USER", "neo4j")
PASSWORD = os.getenv("NEO4J_PASSWORD")

if not PASSWORD:
    raise RuntimeError("NEO4J_PASSWORD environment variable must be set.")
try:
    neo4j_driver = AsyncGraphDatabase.driver(URI, auth=(USER, PASSWORD))
    logger.info("Backend successfully connected to Neo4j")
except Exception as e:
    logger.error(f"Failed to connect to Neo4j: {e}")
    neo4j_driver = None


async def get_neo4j_session():
    if not neo4j_driver:
        raise RuntimeError(
            "Neo4j driver is not initialized. Check logs for connection errors."
        )
    async with neo4j_driver.session() as session:
        yield session
