import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { readFileSync, writeFileSync } from 'fs';

const md = readFileSync('docs/outreach-messages.md', 'utf-8');
const lines = md.split('\n');

const children = [];

children.push(new Paragraph({
  children: [new TextRun({ text: 'Outreach Messages', bold: true, size: 48, font: 'Georgia' })],
  heading: HeadingLevel.TITLE,
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 }
}));
children.push(new Paragraph({
  children: [new TextRun({ text: 'Former Pure Romance Reps & Independent Sellers', size: 24, font: 'Georgia', color: '9a8b80' })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 400 }
}));

let i = 3;
while (i < lines.length) {
  const line = lines[i];

  if (line.startsWith('## ')) {
    const text = line.replace(/^##\s*/, '').replace(/\*\*/g, '');
    children.push(new Paragraph({
      children: [new TextRun({ text, bold: true, size: 28, font: 'Georgia', color: '42423f' })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 600, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '9a8b80' } }
    }));
    i++;
    continue;
  }

  if (line.startsWith('**')) {
    const cleaned = line.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    const colonIdx = cleaned.indexOf(':');
    if (colonIdx > -1) {
      const label = cleaned.substring(0, colonIdx + 1);
      const value = cleaned.substring(colonIdx + 1).trim();
      children.push(new Paragraph({
        children: [
          new TextRun({ text: label + ' ', bold: true, size: 20, font: 'Georgia', color: '5c5c5a' }),
          new TextRun({ text: value, size: 20, font: 'Georgia', color: '5c5c5a' })
        ],
        spacing: { after: 40 }
      }));
    } else {
      children.push(new Paragraph({
        children: [new TextRun({ text: cleaned, bold: true, size: 20, font: 'Georgia', color: '5c5c5a' })],
        spacing: { after: 40 }
      }));
    }
    i++;
    continue;
  }

  if (line.trim() === '---') { i++; continue; }
  if (line.trim() === '') { i++; continue; }
  if (line.startsWith('>')) { i++; continue; }

  const text = line.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  children.push(new Paragraph({
    children: [new TextRun({ text, size: 22, font: 'Georgia', color: '42423f' })],
    spacing: { after: 120 }
  }));
  i++;
}

const doc = new Document({
  sections: [{
    properties: {
      page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } }
    },
    children
  }]
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('docs/playthings-outreach-messages.docx', buffer);
console.log('Done');
