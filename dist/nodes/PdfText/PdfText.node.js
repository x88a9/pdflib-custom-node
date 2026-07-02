"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfText = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const pdf_lib_1 = require("pdf-lib");
// Maps the font dropdown values to pdf-lib's StandardFonts.
const FONT_MAP = {
    Helvetica: pdf_lib_1.StandardFonts.Helvetica,
    'Helvetica-Bold': pdf_lib_1.StandardFonts.HelveticaBold,
    'Times-Roman': pdf_lib_1.StandardFonts.TimesRoman,
    Courier: pdf_lib_1.StandardFonts.Courier,
};
/**
 * Converts a hex color string (e.g. "#1a2b3c" or "1a2b3c") to a pdf-lib rgb()
 * color. Falls back to black on malformed input.
 */
function hexToRgb(hex) {
    let value = (hex || '').trim().replace(/^#/, '');
    if (value.length === 3) {
        value = value
            .split('')
            .map((c) => c + c)
            .join('');
    }
    if (!/^[0-9a-fA-F]{6}$/.test(value)) {
        return (0, pdf_lib_1.rgb)(0, 0, 0);
    }
    const r = parseInt(value.slice(0, 2), 16) / 255;
    const g = parseInt(value.slice(2, 4), 16) / 255;
    const b = parseInt(value.slice(4, 6), 16) / 255;
    return (0, pdf_lib_1.rgb)(r, g, b);
}
/**
 * Resolves the output file name.
 * - If the user supplied a name, it is used as-is and ".pdf" is appended when
 *   missing (case-insensitive), so "test" and "test.pdf" both yield "test.pdf".
 * - If left empty, the input file name is reused with an "_edited" suffix before
 *   the extension, e.g. "report.pdf" -> "report_edited.pdf". When there is no
 *   input file name it falls back to "output_edited.pdf".
 */
function resolveOutputFileName(userInput, inputFileName) {
    const trimmed = (userInput || '').trim();
    if (trimmed) {
        return /\.pdf$/i.test(trimmed) ? trimmed : `${trimmed}.pdf`;
    }
    const source = (inputFileName || '').trim() || 'output.pdf';
    const base = source.replace(/\.pdf$/i, '');
    return `${base}_edited.pdf`;
}
class PdfText {
    constructor() {
        this.description = {
            displayName: 'PDF Text',
            name: 'pdfText',
            icon: 'file:PdfText.node.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{ "Insert text into PDF" }}',
            description: 'Insert text at X/Y positions into an existing PDF using pdf-lib',
            defaults: {
                name: 'PDF Text',
            },
            inputs: ['main'],
            outputs: ['main'],
            properties: [
                {
                    displayName: 'Input Binary Property',
                    name: 'inputBinaryProperty',
                    type: 'string',
                    default: 'data',
                    required: true,
                    description: 'Name of the binary property on the incoming item that contains the source PDF',
                },
                {
                    displayName: 'Text Fields',
                    name: 'textFields',
                    placeholder: 'Add Text Field',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    default: {},
                    description: 'The text entries to draw onto the PDF',
                    options: [
                        {
                            name: 'field',
                            displayName: 'Field',
                            values: [
                                {
                                    displayName: 'Text',
                                    name: 'text',
                                    type: 'string',
                                    default: '',
                                    description: 'The text to insert. Supports n8n expressions.',
                                },
                                {
                                    displayName: 'X (pt From Left)',
                                    name: 'x',
                                    type: 'number',
                                    default: 50,
                                    description: 'Horizontal position in points, measured from the left edge of the page',
                                },
                                {
                                    displayName: 'Y (pt From Bottom)',
                                    name: 'y',
                                    type: 'number',
                                    default: 50,
                                    description: 'Vertical position in points. Note: in pdf-lib Y is measured from the BOTTOM of the page, so larger values move the text up.',
                                },
                                {
                                    displayName: 'Font Size',
                                    name: 'fontSize',
                                    type: 'number',
                                    default: 12,
                                    description: 'Font size in points',
                                },
                                {
                                    displayName: 'Font',
                                    name: 'font',
                                    type: 'options',
                                    default: 'Helvetica',
                                    options: [
                                        { name: 'Helvetica', value: 'Helvetica' },
                                        { name: 'Helvetica Bold', value: 'Helvetica-Bold' },
                                        { name: 'Times Roman', value: 'Times-Roman' },
                                        { name: 'Courier', value: 'Courier' },
                                    ],
                                    description: 'The standard PDF font to render the text with',
                                },
                                {
                                    displayName: 'Color',
                                    name: 'color',
                                    type: 'color',
                                    default: '#000000',
                                    description: 'Text color as a hex string (e.g. #000000)',
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'Page Number',
                    name: 'pageNumber',
                    type: 'number',
                    default: 1,
                    description: '1-based page number to draw the text on. Use 0 to apply the text to all pages.',
                },
                {
                    displayName: 'Output Binary Property',
                    name: 'outputBinaryProperty',
                    type: 'string',
                    default: 'data',
                    required: true,
                    description: 'Name of the binary property to write the modified PDF to on the output item',
                },
                {
                    displayName: 'Output File Name',
                    name: 'outputFileName',
                    type: 'string',
                    default: '',
                    placeholder: 'e.g. invoice or invoice.pdf',
                    description: 'File name for the output PDF. The ".pdf" extension is added automatically if you leave it off. If empty, the input file name is used with an "_edited" suffix (e.g. "report.pdf" becomes "report_edited.pdf").',
                },
            ],
        };
    }
    async execute() {
        var _a;
        const items = this.getInputData();
        const returnData = [];
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                const inputBinaryProperty = this.getNodeParameter('inputBinaryProperty', itemIndex);
                const outputBinaryProperty = this.getNodeParameter('outputBinaryProperty', itemIndex);
                const outputFileName = this.getNodeParameter('outputFileName', itemIndex, '');
                const pageNumber = this.getNodeParameter('pageNumber', itemIndex);
                const textFieldsCollection = this.getNodeParameter('textFields.field', itemIndex, []);
                // Load the incoming PDF binary.
                const inputBinary = this.helpers.assertBinaryData(itemIndex, inputBinaryProperty);
                const pdfBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, inputBinaryProperty);
                const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBuffer);
                const pages = pdfDoc.getPages();
                // Resolve which pages to draw on (0 = all pages).
                let targetPages;
                if (pageNumber === 0) {
                    targetPages = pages;
                }
                else {
                    if (pageNumber < 1 || pageNumber > pages.length) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Page number ${pageNumber} is out of range. The PDF has ${pages.length} page(s).`, { itemIndex });
                    }
                    targetPages = [pages[pageNumber - 1]];
                }
                // Cache embedded fonts so each font is only embedded once.
                const fontCache = {};
                const getFont = async (fontKey) => {
                    var _a;
                    const standardFont = (_a = FONT_MAP[fontKey]) !== null && _a !== void 0 ? _a : pdf_lib_1.StandardFonts.Helvetica;
                    if (!fontCache[standardFont]) {
                        fontCache[standardFont] = await pdfDoc.embedFont(standardFont);
                    }
                    return fontCache[standardFont];
                };
                for (const fieldRaw of textFieldsCollection) {
                    const text = `${(_a = fieldRaw.text) !== null && _a !== void 0 ? _a : ''}`;
                    const x = Number(fieldRaw.x) || 0;
                    const y = Number(fieldRaw.y) || 0;
                    const size = Number(fieldRaw.fontSize) || 12;
                    const font = await getFont(fieldRaw.font);
                    const color = hexToRgb(fieldRaw.color);
                    for (const page of targetPages) {
                        page.drawText(text, { x, y, size, font, color });
                    }
                }
                const modifiedPdf = await pdfDoc.save();
                const fileName = resolveOutputFileName(outputFileName, inputBinary.fileName);
                // Output only the generated PDF — the input binary is intentionally
                // not carried through, so the output item contains just the result.
                const newItem = {
                    json: items[itemIndex].json,
                    binary: {
                        [outputBinaryProperty]: await this.helpers.prepareBinaryData(Buffer.from(modifiedPdf), fileName, 'application/pdf'),
                    },
                    pairedItem: { item: itemIndex },
                };
                returnData.push(newItem);
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: items[itemIndex].json,
                        error: error,
                        pairedItem: { item: itemIndex },
                    });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}
exports.PdfText = PdfText;
