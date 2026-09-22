import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from app.models.models import Booking

class TicketPDFService:
    @staticmethod
    def generate_ticket_pdf(booking: Booking) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor('#0F2942'),
            fontName='Helvetica-Bold',
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'SubTitleStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#E11D48'),
            fontName='Helvetica-Bold',
            spaceAfter=12
        )
        body_bold = ParagraphStyle('BodyBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9)
        body_norm = ParagraphStyle('BodyNorm', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#333333'))

        elements = []

        # Header
        elements.append(Paragraph("RAILONE", title_style))
        elements.append(Paragraph("ELECTRONIC RESERVATION SLIP (ERS) - DEMO DIGITAL TICKET", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0F2942'), spaceAfter=10))

        # Booking metadata table
        meta_data = [
            [
                Paragraph("<b>PNR Number:</b>", body_bold), Paragraph(str(booking.pnr), body_norm),
                Paragraph("<b>Booking ID:</b>", body_bold), Paragraph(str(booking.booking_id), body_norm),
            ],
            [
                Paragraph("<b>Train:</b>", body_bold), Paragraph(f"{booking.train.train_number} - {booking.train.name}", body_norm),
                Paragraph("<b>Class & Quota:</b>", body_bold), Paragraph(f"{booking.coach_class} | {booking.quota}", body_norm),
            ],
            [
                Paragraph("<b>From Station:</b>", body_bold), Paragraph(f"{booking.from_station.name} ({booking.from_station.code})", body_norm),
                Paragraph("<b>To Station:</b>", body_bold), Paragraph(f"{booking.to_station.name} ({booking.to_station.code})", body_norm),
            ],
            [
                Paragraph("<b>Journey Date:</b>", body_bold), Paragraph(str(booking.journey_date), body_norm),
                Paragraph("<b>Booking Status:</b>", body_bold), Paragraph(f"<b>{booking.status}</b>", body_bold),
            ]
        ]
        meta_table = Table(meta_data, colWidths=[100, 160, 100, 160])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 14))

        # Passenger details table
        elements.append(Paragraph("<b>PASSENGER DETAILS</b>", body_bold))
        elements.append(Spacer(1, 4))
        pax_headers = ["#", "Passenger Name", "Age / Gender", "Coach", "Seat/Berth", "Status"]
        pax_data = [pax_headers]

        for i, bp in enumerate(booking.passengers, 1):
            coach_str = bp.coach_code or "--"
            seat_str = f"{bp.seat_number} ({bp.berth_type})" if bp.seat_number else "--"
            pax_data.append([
                str(i),
                bp.passenger_name,
                f"{bp.passenger_age} / {bp.passenger_gender}",
                coach_str,
                seat_str,
                bp.status
            ])

        pax_table = Table(pax_data, colWidths=[30, 170, 90, 60, 110, 60])
        pax_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F2942')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (1, 1), (1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(pax_table)
        elements.append(Spacer(1, 14))

        # Fare details table
        elements.append(Paragraph("<b>FARE & PAYMENT SUMMARY</b>", body_bold))
        elements.append(Spacer(1, 4))
        fare_data = [
            [Paragraph("Base Fare:", body_norm), Paragraph(f"₹{booking.base_fare:.2f}", body_bold)],
            [Paragraph("Goods & Service Tax (GST 5%):", body_norm), Paragraph(f"₹{booking.taxes:.2f}", body_norm)],
            [Paragraph("Convenience Fee (incl. GST):", body_norm), Paragraph(f"₹{booking.convenience_fee:.2f}", body_norm)],
            [Paragraph("<b>Total Amount Paid:</b>", body_bold), Paragraph(f"<b>₹{booking.total_amount:.2f}</b>", body_bold)],
            [Paragraph("Payment Status / Method:", body_norm), Paragraph(f"SUCCESS ({booking.payment.payment_method if booking.payment else 'UPI'})", body_norm)],
        ]
        fare_table = Table(fare_data, colWidths=[300, 220])
        fare_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F1F5F9')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(fare_table)
        elements.append(Spacer(1, 14))

        # Important instructions
        elements.append(Paragraph("<b>IMPORTANT INSTRUCTIONS FOR PASSENGERS</b>", body_bold))
        instructions = (
            "1. Valid original Photo Identity Card (Aadhaar, Passport, Driving License, Voter ID) must be carried during the journey.<br/>"
            "2. Please arrive at the departure platform at least 20 minutes before the scheduled train departure.<br/>"
            "3. This is an authentic digital electronic reservation slip generated by RailOne.<br/>"
            "4. For cancellations, visit RailOne My Bookings before chart preparation for instantaneous refund credit."
        )
        elements.append(Paragraph(instructions, body_norm))
        elements.append(Spacer(1, 15))

        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=8))
        footer_text = f"Generated by RailOne – Railway Ticket Booking & Management System on {datetime.now().strftime('%d-%b-%Y %H:%M:%S')} IST | System Demo Ticket"
        elements.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.gray, alignment=1)))

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
