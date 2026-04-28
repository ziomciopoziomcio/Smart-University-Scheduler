import logging
from aiokafka import AIOKafkaProducer

logger = logging.getLogger(__name__)


class KafkaManager:
    producer: AIOKafkaProducer | None = None


kafka_manager = KafkaManager()


async def send_event(topic: str, msg: dict) -> bool:
    """
    send a message to kafka topic
    :param topic: kafka topic
    :param msg: kafka message
    :return: True if the message was sent successfully, False otherwise
    """
    if not kafka_manager.producer:
        logger.error("Kafka producer not initialized")
        return False

    try:
        await kafka_manager.producer.send_and_wait(topic, value=msg)
        logger.info("Event sent to kafka")
        return True

    except Exception as e:
        logger.exception(f"Event sending error: {e}")
        return False
