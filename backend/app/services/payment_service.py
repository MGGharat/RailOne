import uuid
from datetime import datetime
from app.models.models import Payment, PaymentStatus

class PaymentService:
    @staticmethod
    def simulate_payment_verification(payment_method: str, amount: float) -> dict:
        """
        Simulates payment gateway transaction verification without storing real card numbers.
        """
        txn_id = f"TXN-RC-{uuid.uuid4().hex.upper()}"
        gateway_ref = f"SIM-GW-{uuid.uuid4().hex[:8].upper()}"
        return {
            "transaction_id": txn_id,
            "provider_ref": gateway_ref,
            "payment_method": payment_method.upper(),
            "amount": amount,
            "status": PaymentStatus.SUCCESS,
            "verified_at": datetime.utcnow().isoformat()
        }
