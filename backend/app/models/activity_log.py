from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_name = Column(String(255), nullable=False)
    action = Column(String(50), nullable=False)  # DELETE_REQUEST, DELETE_PERMANENT, PRICE_CHANGE, STOCK_UPDATE
    entity_type = Column(String(50), nullable=False)  # product, customer, sale
    entity_id = Column(Integer, nullable=True)
    entity_name = Column(String(255), nullable=False)
    details = Column(Text, nullable=False)
    payload = Column(Text, nullable=True)  # JSON-encoded changes requested
    status = Column(String(50), nullable=False, default="LOGGED")  # PENDING_APPROVAL, APPROVED, DISMISSED, LOGGED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    business = relationship("Business", back_populates="activity_logs")
    user = relationship("User", back_populates="activity_logs")
