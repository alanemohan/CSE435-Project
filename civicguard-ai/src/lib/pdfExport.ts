// PDF Export utility using browser's print functionality
// This creates a clean, formatted PDF from complaint data

interface ComplaintData {
  subjectLine: string;
  formalComplaint: string;
  suggestedAuthority: string;
  suggestedPortal: string;
  category?: string;
  date?: string;
  location?: string;
}

export function generateComplaintPDF(data: ComplaintData): void {
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Please allow popups to download the PDF');
    return;
  }

  const formattedDate = data.date || new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Complaint - ${data.subjectLine}</title>
      <style>
        @media print {
          @page {
            margin: 2cm;
            size: A4;
          }
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #000;
          background: #fff;
          padding: 40px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid #333;
        }
        
        .header h1 {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .header p {
          font-size: 10pt;
          color: #666;
        }
        
        .metadata {
          display: flex;
          justify-content: space-between;
          margin-bottom: 25px;
          font-size: 11pt;
        }
        
        .metadata-left, .metadata-right {
          max-width: 48%;
        }
        
        .metadata strong {
          display: block;
          margin-bottom: 3px;
        }
        
        .subject {
          background: #f5f5f5;
          padding: 12px 15px;
          margin-bottom: 25px;
          border-left: 4px solid #333;
        }
        
        .subject strong {
          font-size: 11pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .subject span {
          display: block;
          margin-top: 5px;
          font-size: 12pt;
        }
        
        .content {
          text-align: justify;
          white-space: pre-wrap;
          margin-bottom: 30px;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }
        
        .footer-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 10pt;
          color: #666;
        }
        
        .disclaimer {
          margin-top: 30px;
          padding: 10px;
          background: #fff9e6;
          border: 1px solid #ffe066;
          font-size: 9pt;
          color: #856404;
        }
        
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 24px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .print-button:hover {
          background: #1d4ed8;
        }
        
        @media print {
          .print-button {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <button class="print-button" onclick="window.print()">Download as PDF</button>
      
      <div class="header">
        <h1>FORMAL COMPLAINT</h1>
        <p>Generated via CivicShield - Citizen Safety Platform</p>
      </div>
      
      <div class="metadata">
        <div class="metadata-left">
          <strong>Date:</strong> ${formattedDate}
          ${data.location ? `<br><strong>Location:</strong> ${data.location}` : ''}
        </div>
        <div class="metadata-right">
          ${data.category ? `<strong>Category:</strong> ${data.category}` : ''}
        </div>
      </div>
      
      <div class="subject">
        <strong>Subject:</strong>
        <span>${data.subjectLine}</span>
      </div>
      
      <div class="content">
${data.formalComplaint}
      </div>
      
      <div class="footer">
        <div class="footer-info">
          <div>
            <strong>Suggested Authority:</strong><br>
            ${data.suggestedAuthority}
          </div>
          <div>
            <strong>Suggested Portal:</strong><br>
            ${data.suggestedPortal}
          </div>
        </div>
      </div>
      
      <div class="disclaimer">
        ⚠️ <strong>Disclaimer:</strong> This complaint has been generated using AI assistance. 
        Please review and modify as needed before submission. This is not legal advice.
      </div>
      
      <script>
        // Auto-trigger print dialog after a short delay
        setTimeout(() => {
          // Only auto-print if user hasn't already clicked the button
        }, 500);
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export function generateReportPDF(report: {
  title: string;
  sections: Array<{ heading: string; content: string }>;
  footer: string;
  authority: string;
  format: string;
}): void {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Please allow popups to download the PDF');
    return;
  }

  const sectionsHtml = report.sections.map(section => `
    <div class="section">
      <h3>${section.heading}</h3>
      <p>${section.content}</p>
    </div>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${report.title}</title>
      <style>
        @media print {
          @page { margin: 2cm; size: A4; }
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #000;
          padding: 40px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid #333;
        }
        .header h1 { font-size: 16pt; }
        .header p { font-size: 10pt; color: #666; }
        .section {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }
        .section h3 {
          font-size: 12pt;
          margin-bottom: 10px;
          color: #333;
        }
        .section p {
          white-space: pre-wrap;
          text-align: justify;
        }
        .footer { margin-top: 30px; font-style: italic; }
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 24px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        @media print { .print-button { display: none; } }
      </style>
    </head>
    <body>
      <button class="print-button" onclick="window.print()">Download as PDF</button>
      
      <div class="header">
        <h1>${report.title}</h1>
        <p>${report.format} for ${report.authority}</p>
      </div>
      
      ${sectionsHtml}
      
      <div class="footer">${report.footer}</div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
