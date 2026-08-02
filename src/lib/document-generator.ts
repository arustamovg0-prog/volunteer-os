import PDFDocument from 'pdfkit';
import path from 'path';

export interface DocumentData {
  volunteerName: string;
  projectName?: string;
  hours?: number;
  date: string;
  type: 'contract' | 'certificate';
}

export function generateDocument(data: DocumentData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Register Cyrillic fonts
    const fontRegularPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
    const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');
    
    doc.registerFont('Roboto', fontRegularPath);
    doc.registerFont('Roboto-Bold', fontBoldPath);

    if (data.type === 'contract') {
      doc.font('Roboto-Bold').fontSize(18).text('ДОГОВОР ВОЛОНТЕРА', { align: 'center' });
      doc.moveDown(2);
      
      doc.font('Roboto').fontSize(12).text(`Дата: ${data.date}`, { align: 'right' });
      doc.moveDown(2);
      
      doc.text(`Настоящий договор подтверждает участие волонтера ${data.volunteerName} в проектах платформы Volunteer OS.`);
      doc.moveDown();
      doc.text(`Волонтер обязуется добросовестно выполнять взятые на себя задачи, следовать Кодексу волонтера и уважительно относиться к координаторам и другим участникам проекта.`);
      doc.moveDown();
      doc.text(`Координатор обязуется предоставлять безопасные условия, необходимые инструкции и засчитывать подтвержденные часы волонтерской деятельности.`);
      
      doc.moveDown(4);
      doc.text('Подпись волонтера: ________________________');
      doc.moveDown(2);
      doc.text('Подпись координатора: _____________________');
      
    } else if (data.type === 'certificate') {
      doc.font('Roboto-Bold').fontSize(24).fillColor('#0f172a').text('СЕРТИФИКАТ ВОЛОНТЕРА', { align: 'center' });
      doc.moveDown(2);
      
      doc.font('Roboto').fontSize(14).fillColor('#334155').text('Настоящим подтверждается, что', { align: 'center' });
      doc.moveDown();
      
      doc.font('Roboto-Bold').fontSize(20).fillColor('#0ea5e9').text(data.volunteerName, { align: 'center' });
      doc.moveDown();
      
      doc.font('Roboto').fontSize(14).fillColor('#334155').text(`принял(а) активное участие в проекте "${data.projectName || 'Волонтерская программа'}"`, { align: 'center' });
      doc.moveDown();
      
      if (data.hours) {
        doc.text(`и внес(ла) вклад в размере ${data.hours} часов.`, { align: 'center' });
        doc.moveDown(2);
      }
      
      doc.font('Roboto-Bold').fontSize(12).fillColor('#000000').text(`Дата выдачи: ${data.date}`, { align: 'center' });
    }

    doc.end();
  });
}

export interface TemplateData {
  volunteerName: string;
  projectName?: string;
  hours?: number;
  date: string;
  template: {
    title: string;
    bodyText: string;
    signature: string;
    primaryColor: string;
    accentColor: string;
  };
}

export function generateTemplateDocument(data: TemplateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Landscape A4 for certificates
    const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Register Cyrillic fonts
    const fontRegularPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
    const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');
    
    try {
      doc.registerFont('Roboto', fontRegularPath);
      doc.registerFont('Roboto-Bold', fontBoldPath);
    } catch (e) {
      console.warn("Could not load Roboto fonts, falling back to built-in fonts (may break Cyrillic)", e);
    }

    // Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke(data.template.primaryColor);
    doc.rect(24, 24, doc.page.width - 48, doc.page.height - 48).stroke(data.template.accentColor);

    // Title
    doc.moveDown(3);
    doc.font('Roboto-Bold').fontSize(42).fillColor(data.template.primaryColor).text(data.template.title, { align: 'center' });
    doc.moveDown(2);

    // Parse Body
    let parsedBody = data.template.bodyText;
    parsedBody = parsedBody.replace(/\{\{name\}\}/g, data.volunteerName);
    parsedBody = parsedBody.replace(/\{\{project\}\}/g, data.projectName || '');
    parsedBody = parsedBody.replace(/\{\{date\}\}/g, data.date);
    parsedBody = parsedBody.replace(/\{\{hours\}\}/g, data.hours ? data.hours.toString() : '');

    const textX = (doc.page.width - 600) / 2;
    doc.font('Roboto').fontSize(18).fillColor('#333333').text(parsedBody, textX, doc.y, { align: 'center', width: 600 });
    
    doc.moveDown(4);

    // Signature & Date
    doc.font('Roboto-Bold').fontSize(14).text(data.template.signature, 100, doc.page.height - 150);
    doc.font('Roboto').fontSize(12).text('_______________ / Подпись /', 100, doc.page.height - 120);

    doc.font('Roboto-Bold').fontSize(14).text('Дата выдачи', doc.page.width - 250, doc.page.height - 150);
    doc.font('Roboto').fontSize(12).text(data.date, doc.page.width - 250, doc.page.height - 120);

    doc.end();
  });
}

