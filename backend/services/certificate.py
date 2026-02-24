from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
import io
from datetime import datetime

def generate_certificate_pdf(user_name: str, score: float, tier: str, insights: list):
    """
    Generates a PDF certificate in memory and returns the bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    title_style = styles['Title']
    title_style.textColor = colors.HexColor("#06b6d4")
    elements.append(Paragraph("CREDISCOUT CERTIFICATE", title_style))
    elements.append(Spacer(1, 20))

    # User Info
    elements.append(Paragraph(f"<b>Name:</b> {user_name}", styles['Normal']))
    elements.append(Paragraph(f"<b>Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
    elements.append(Spacer(1, 20))

    # Score
    score_style = styles['Heading1']
    score_style.alignment = 1 # Center
    elements.append(Paragraph(f"CREDIT READINESS SCORE: {score}/100", score_style))
    elements.append(Paragraph(f"RISK TIER: {tier}", score_style))
    elements.append(Spacer(1, 30))

    # Insights Table
    elements.append(Paragraph("Key Behavioral Insights:", styles['Heading2']))
    elements.append(Spacer(1, 10))
    
    data = [["Feature", "Impact", "Status"]]
    for insight in insights:
        status = "Positive" if insight['impact'] > 0 else "Negative"
        data.append([insight['feature'], f"{insight['impact']:.2f}", status])
        
    table = Table(data, colWidths=[200, 100, 100])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#06b6d4")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(table)
    elements.append(Spacer(1, 40))

    # Disclaimer
    elements.append(Paragraph("<i>Disclaimer: This certificate is based on behavioral transaction analysis and does not constitute an official credit score.</i>", styles['Italic']))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
