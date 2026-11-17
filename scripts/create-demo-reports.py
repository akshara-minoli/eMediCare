from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
import fitz

out = Path('output/pdf')
out.mkdir(parents=True, exist_ok=True)
preview = Path('tmp/pdfs')
preview.mkdir(parents=True, exist_ok=True)
for slug, title, date, rows in [
    ('demo-wellness-report', 'Sample Wellness Report', '27 October 2026', [
        ('Record type', 'Fictional routine wellness visit'),
        ('Purpose', 'Demonstrate report upload, viewing, and download'),
        ('Clinical findings', 'No real measurements or diagnoses recorded'),
        ('Follow-up', 'Sample follow-up appointment in the demo dashboard')]),
    ('demo-consultation-summary', 'Sample Consultation Summary', '11 November 2026', [
        ('Record type', 'Fictional video consultation'),
        ('Status', 'Completed - demonstration only'),
        ('Prescription', 'None - no medical advice or treatment provided'),
        ('Payment', 'Simulated transaction; no money charged')])
]:
    path = out / f'{slug}.pdf'
    c = canvas.Canvas(str(path), pagesize=(595, 842))
    c.setTitle(title + ' - DEMO DATA')
    c.setFillColor(HexColor('#151d39')); c.rect(0, 695, 595, 147, fill=1, stroke=0)
    c.setFillColor(HexColor('#ffffff')); c.setFont('Helvetica-Bold', 25)
    c.drawString(45, 790, 'eMediCare')
    c.setFont('Helvetica', 17); c.drawString(45, 751, title)
    c.setFont('Helvetica-Bold', 11); c.drawString(45, 718, 'DEMO DATA - NOT A REAL MEDICAL RECORD')
    c.setFillColor(HexColor('#26334a')); c.setFont('Helvetica', 11)
    c.drawString(45, 659, 'Demo patient record | ' + date)
    y = 603
    for label, value in rows:
        c.setFont('Helvetica-Bold', 11); c.drawString(45, y, label)
        c.setFont('Helvetica', 10); c.drawString(45, y-23, value)
        c.setStrokeColor(HexColor('#dde3ef')); c.line(45, y-40, 550, y-40)
        y -= 83
    c.setFont('Helvetica', 10)
    c.drawString(45, 175, 'This fictional document is supplied only to test the application.')
    c.drawString(45, 157, 'It does not describe the health of the account holder.')
    c.setFont('Helvetica', 9); c.drawString(45, 45, 'eMediCare demo dataset'); c.drawRightString(550, 45, 'Page 1 of 1')
    c.save()
    doc = fitz.open(path)
    assert len(doc) == 1 and 'DEMO DATA' in doc[0].get_text()
    doc[0].get_pixmap(matrix=fitz.Matrix(1, 1)).save(preview / f'{slug}.png')
    print(path)
