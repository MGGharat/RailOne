from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.payment_service import PaymentService
from app.core.exceptions import success_response

router = APIRouter(prefix="/payments", tags=["Payments"])

class PaymentVerifyIn(BaseModel):
    payment_method: str = "UPI"
    amount: float

@router.post("/verify")
def verify_simulated_payment(req: PaymentVerifyIn):
    result = PaymentService.simulate_payment_verification(req.payment_method, req.amount)
    return success_response(
        data=result,
        message="Simulated payment successfully processed"
    )
