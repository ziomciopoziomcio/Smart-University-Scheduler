import json
import logging
from aiokafka import AIOKafkaProducer

logger = logging.getLogger(__name__)


class KafkaManager:
    producer: AIOKafkaProducer | None = None


kafka_manager = KafkaManager()


async def send_event(topic: str, msg: dict):
    """
    send a message to kafka topic
    :param topic: kafka topic
    :param msg: kafka message
    :return: None
    """
    if not kafka_manager.producer:
        logger.error("Kafka producer not initialized")
        return

    try:
        value = json.dumps(msg).encode("utf-8")

        await kafka_manager.producer.send_and_wait(topic, value=value)
        logger.info("Event sent to kafka")

    except Exception as e:
        logger.error(f"Event sending error: {e}")
