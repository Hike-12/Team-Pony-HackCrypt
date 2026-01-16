const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const pdfParse = require('pdf-parse');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Parse timetable from uploaded file using Gemini AI
 * @param {string} filePath - Path to uploaded file
 * @param {string} mimeType - MIME type of file
 * @returns {Promise<Object>} Parsed timetable data
 */
async function parseTimetableFromFile(filePath, mimeType) {
  try {
    let extractedText = '';
    let structuredData = null;

    // Extract content based on file type
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
      structuredData = await parseExcelFile(filePath);
      extractedText = JSON.stringify(structuredData, null, 2);
    } else if (mimeType.includes('pdf') || filePath.endsWith('.pdf')) {
      extractedText = await parsePdfFile(filePath);
    } else if (mimeType.includes('image')) {
      // For images, we'll use Gemini's vision capabilities
      return await parseImageWithGemini(filePath, mimeType);
    } else {
      throw new Error('Unsupported file type. Please upload Excel, PDF, or image files.');
    }

    // Use Gemini to parse the extracted text/data
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert at parsing timetable/schedule data. Analyze the following timetable data and extract structured information.

Input Data:
${extractedText}

Extract and return a JSON object with the following structure:
{
  "slots": [
    {
      "slot_name": "L1",
      "start_time": "09:00",
      "end_time": "10:00",
      "sort_order": 1
    }
  ],
  "entries": [
    {
      "day_of_week": 1,
      "slot_name": "L1",
      "subject_code": "CS101",
      "subject_name": "Computer Science",
      "teacher_name": "Dr. Smith",
      "class_name": "SE-COMP",
      "batch_year": 2024,
      "division": "A",
      "room_label": "C-203",
      "session_type": "LECTURE"
    }
  ]
}

Important rules:
- day_of_week: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
- session_type must be one of: "LECTURE", "LAB", "TUTORIAL", "Online"
- If any field cannot be determined from the data, omit it or set it to null
- start_time and end_time should be in HH:mm format (24-hour)
- Ensure all time slots are extracted from the timetable
- Match entries to their corresponding time slots by slot_name

Return ONLY the JSON object, no additional text or explanation.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    
    // Validate the structure
    if (!parsedData.slots || !Array.isArray(parsedData.slots)) {
      parsedData.slots = [];
    }
    if (!parsedData.entries || !Array.isArray(parsedData.entries)) {
      parsedData.entries = [];
    }

    return parsedData;
  } catch (error) {
    console.error('Error parsing timetable:', error);
    throw error;
  }
}

/**
 * Parse Excel file and extract data
 */
async function parseExcelFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  return {
    sheetName,
    data: data.filter(row => row.some(cell => cell !== ''))
  };
}

/**
 * Parse PDF file and extract text
 */
async function parsePdfFile(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);
  return pdfData.text;
}

/**
 * Parse image using Gemini Vision API
 */
async function parseImageWithGemini(filePath, mimeType) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Read the image file
  const imageData = fs.readFileSync(filePath);
  const base64Image = imageData.toString('base64');

  const prompt = `You are an expert at parsing timetable/schedule images. Analyze this timetable image and extract all structured information.

Extract and return a JSON object with the following structure:
{
  "slots": [
    {
      "slot_name": "L1",
      "start_time": "09:00",
      "end_time": "10:00",
      "sort_order": 1
    }
  ],
  "entries": [
    {
      "day_of_week": 1,
      "slot_name": "L1",
      "subject_code": "CS101",
      "subject_name": "Computer Science",
      "teacher_name": "Dr. Smith",
      "class_name": "SE-COMP",
      "batch_year": 2024,
      "division": "A",
      "room_label": "C-203",
      "session_type": "LECTURE"
    }
  ]
}

Important rules:
- day_of_week: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
- session_type must be one of: "LECTURE", "LAB", "TUTORIAL", "Online"
- If any field cannot be determined from the image, omit it or set it to null
- start_time and end_time should be in HH:mm format (24-hour)
- Extract all visible time slots from the timetable
- Match entries to their corresponding time slots by slot_name
- Read all text carefully including subject names, teacher names, room numbers

Return ONLY the JSON object, no additional text or explanation.`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: mimeType,
        data: base64Image
      }
    }
  ]);

  const response = await result.response;
  const text = response.text();

  // Parse the JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from AI response');
  }

  const parsedData = JSON.parse(jsonMatch[0]);
  
  // Validate the structure
  if (!parsedData.slots || !Array.isArray(parsedData.slots)) {
    parsedData.slots = [];
  }
  if (!parsedData.entries || !Array.isArray(parsedData.entries)) {
    parsedData.entries = [];
  }

  return parsedData;
}

module.exports = {
  parseTimetableFromFile
};
