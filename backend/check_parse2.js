const { PDFParse } = require('pdf-parse');
const instance = new PDFParse(Buffer.alloc(100));
console.log('instance keys:', Object.keys(instance));
console.log('prototype keys:', Object.keys(PDFParse.prototype));
