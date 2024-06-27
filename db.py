from app import app, db
from loguru import logger



try:

    # Create tables
    with app.app_context():
        db.create_all()
        logger.info("Tables created successfully")

except Exception as e:
    logger.error(f"Something went wrong: {e}")

