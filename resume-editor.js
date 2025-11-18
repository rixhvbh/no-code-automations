/**
 * Resume Editor - Layout-Safe Resume Editing System
 * Approach: HTML Template + Playwright for pixel-perfect PDF generation
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class ResumeEditor {
  constructor() {
    this.browser = null;
  }

  /**
   * Initialize browser instance
   */
  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  /**
   * Close browser instance
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Generate PDF from HTML template with updated content
   * @param {string} templatePath - Path to HTML template
   * @param {object} data - Data to inject into template
   * @param {string} outputPath - Output PDF path
   * @returns {Promise<string>} Path to generated PDF
   */
  async generatePDFFromTemplate(templatePath, data, outputPath) {
    await this.init();

    // Read the HTML template
    let htmlContent = await fs.readFile(templatePath, 'utf-8');

    // Replace placeholders with actual data
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), data[key]);
    });

    // Create a new page
    const page = await this.browser.newPage();

    // Set content and wait for fonts/styles to load
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle'
    });

    // Generate PDF with high quality settings
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },
      preferCSSPageSize: true
    });

    await page.close();

    console.log(`✅ PDF generated successfully: ${outputPath}`);
    return outputPath;
  }

  /**
   * Update specific fields in resume using direct HTML manipulation
   * @param {string} templatePath - Path to HTML template
   * @param {object} updates - Fields to update {selector: newValue}
   * @param {string} outputPath - Output PDF path
   * @returns {Promise<string>} Path to generated PDF
   */
  async updateResumeFields(templatePath, updates, outputPath) {
    await this.init();

    // Read the HTML template
    const htmlContent = await fs.readFile(templatePath, 'utf-8');

    // Create a new page
    const page = await this.browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });

    // Update each field using selectors
    for (const [selector, newValue] of Object.entries(updates)) {
      await page.evaluate((sel, val) => {
        const element = document.querySelector(sel);
        if (element) {
          element.textContent = val;
        }
      }, selector, newValue);
    }

    // Generate PDF
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      preferCSSPageSize: true
    });

    await page.close();

    console.log(`✅ Resume updated successfully: ${outputPath}`);
    return outputPath;
  }

  /**
   * Find and replace text in HTML template
   * @param {string} templatePath - Path to HTML template
   * @param {object} replacements - Text replacements {oldText: newText}
   * @param {string} outputPath - Output PDF path
   * @returns {Promise<string>} Path to generated PDF
   */
  async findAndReplace(templatePath, replacements, outputPath) {
    await this.init();

    let htmlContent = await fs.readFile(templatePath, 'utf-8');

    // Perform text replacements
    Object.keys(replacements).forEach(oldText => {
      const newText = replacements[oldText];
      htmlContent = htmlContent.replace(new RegExp(oldText, 'g'), newText);
    });

    const page = await this.browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      preferCSSPageSize: true
    });

    await page.close();

    console.log(`✅ Text replaced successfully: ${outputPath}`);
    return outputPath;
  }

  /**
   * Create HTML template from existing resume data
   * @param {object} resumeData - Structured resume data
   * @param {string} outputPath - Output HTML path
   * @returns {Promise<string>} Path to HTML template
   */
  async createHTMLTemplate(resumeData, outputPath) {
    const html = this.generateHTMLFromData(resumeData);
    await fs.writeFile(outputPath, html, 'utf-8');
    console.log(`✅ HTML template created: ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate HTML structure from resume data
   * @param {object} data - Resume data
   * @returns {string} HTML content
   */
  generateHTMLFromData(data) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.name || 'Resume'}</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #333;
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            background: white;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        .header h1 {
            font-size: 24pt;
            font-weight: bold;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .header .contact {
            font-size: 10pt;
            color: #666;
        }
        .section {
            margin-bottom: 18px;
        }
        .section-title {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #333;
            margin-bottom: 10px;
            padding-bottom: 4px;
        }
        .job, .education-item, .skill-category {
            margin-bottom: 12px;
        }
        .job-title, .degree {
            font-weight: bold;
            font-size: 12pt;
        }
        .company, .institution {
            font-style: italic;
            color: #666;
        }
        .date {
            float: right;
            color: #666;
            font-size: 10pt;
        }
        .description {
            margin-top: 6px;
            padding-left: 15px;
        }
        .description li {
            margin-bottom: 4px;
        }
        .skills {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .skill-item {
            background: #f0f0f0;
            padding: 5px 12px;
            border-radius: 4px;
            font-size: 10pt;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 id="name">${data.name || '{{name}}'}</h1>
        <div class="contact">
            <span id="email">${data.email || '{{email}}'}</span> |
            <span id="phone">${data.phone || '{{phone}}'}</span> |
            <span id="location">${data.location || '{{location}}'}</span>
        </div>
    </div>

    ${data.summary ? `
    <div class="section">
        <div class="section-title">Professional Summary</div>
        <p id="summary">${data.summary}</p>
    </div>
    ` : ''}

    ${data.experience && data.experience.length > 0 ? `
    <div class="section">
        <div class="section-title">Work Experience</div>
        ${data.experience.map((job, index) => `
        <div class="job">
            <div>
                <span class="job-title" id="job-title-${index}">${job.title || '{{jobTitle}}'}</span>
                <span class="date">${job.date || '{{jobDate}}'}</span>
            </div>
            <div class="company" id="company-${index}">${job.company || '{{company}}'}</div>
            ${job.description ? `
            <ul class="description">
                ${Array.isArray(job.description)
                  ? job.description.map((item, i) => `<li id="job-desc-${index}-${i}">${item}</li>`).join('')
                  : `<li>${job.description}</li>`
                }
            </ul>
            ` : ''}
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${data.education && data.education.length > 0 ? `
    <div class="section">
        <div class="section-title">Education</div>
        ${data.education.map((edu, index) => `
        <div class="education-item">
            <div>
                <span class="degree" id="degree-${index}">${edu.degree || '{{degree}}'}</span>
                <span class="date">${edu.date || '{{eduDate}}'}</span>
            </div>
            <div class="institution" id="institution-${index}">${edu.institution || '{{institution}}'}</div>
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${data.skills && data.skills.length > 0 ? `
    <div class="section">
        <div class="section-title">Skills</div>
        <div class="skills">
            ${data.skills.map((skill, index) => `
                <span class="skill-item" id="skill-${index}">${skill}</span>
            `).join('')}
        </div>
    </div>
    ` : ''}
</body>
</html>`;
  }
}

module.exports = ResumeEditor;
