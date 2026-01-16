const axios = require('axios');
const PDFParser = require('pdf2json');
const Tesseract = require('tesseract.js');
const LeaveApplication = require('../models/LeaveApplication');

// Verify document authenticity using Groq AI
exports.verifyDocument = async (req, res) => {
    try {
        const { leaveId } = req.params;

        const leave = await LeaveApplication.findById(leaveId).populate('student_id', 'full_name roll_no');

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave application not found'
            });
        }

        if (!leave.supporting_document_url) {
            return res.status(400).json({
                success: false,
                message: 'No document attached'
            });
        }

        // Download document
        console.log('📥 Downloading document from:', leave.supporting_document_url);
        const docResponse = await axios.get(leave.supporting_document_url, {
            responseType: 'arraybuffer',
            timeout: 30000
        });

        const dataBuffer = Buffer.from(docResponse.data);
        const fileUrl = leave.supporting_document_url.toLowerCase();

        let extractedText = '';
        let extractionMethod = 'Unknown';

        // ==================== HANDLE PDFs ====================
        if (fileUrl.includes('.pdf')) {
            try {
                console.log('📄 [PDF] Attempting text extraction...');
                const pdfParser = new PDFParser(null, 1);

                const pdfText = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('PDF parsing timeout'));
                    }, 15000);

                    pdfParser.on('pdfParser_dataReady', (pdfData) => {
                        clearTimeout(timeout);
                        try {
                            const pages = pdfData.Pages || [];
                            const textArray = [];

                            pages.forEach(page => {
                                const texts = page.Texts || [];
                                texts.forEach(text => {
                                    if (text.R && text.R[0] && text.R[0].T) {
                                        try {
                                            const decoded = decodeURIComponent(text.R[0].T);
                                            if (decoded.trim()) {
                                                textArray.push(decoded);
                                            }
                                        } catch (e) {
                                            // Skip decode errors
                                        }
                                    }
                                });
                            });

                            resolve(textArray.join(' '));
                        } catch (e) {
                            reject(e);
                        }
                    });

                    pdfParser.on('pdfParser_dataError', (error) => {
                        clearTimeout(timeout);
                        reject(error);
                    });

                    try {
                        pdfParser.parseBuffer(dataBuffer);
                    } catch (e) {
                        clearTimeout(timeout);
                        reject(e);
                    }
                });

                extractedText = pdfText.replace(/\s+/g, ' ').trim();
                extractionMethod = 'PDF Text Extraction';

                if (extractedText.length < 20) {
                    console.log('⚠️ [PDF] Insufficient text extracted');
                    return res.status(400).json({
                        success: false,
                        message: 'This PDF appears to be image-based or scanned. For best results, please upload the document as a JPG or PNG image file instead.',
                        hint: 'Convert your scanned PDF to an image (JPG/PNG) and upload that for AI verification.'
                    });
                }

                console.log(`✅ [PDF] Successfully extracted ${extractedText.length} characters`);

            } catch (pdfError) {
                console.error('❌ [PDF] Extraction failed:', pdfError.message);
                return res.status(400).json({
                    success: false,
                    message: 'Could not extract text from this PDF. It may be image-based, corrupted, or encrypted.',
                    hint: 'If this is a scanned document, please upload it as a JPG or PNG image instead.'
                });
            }
        }
        // ==================== HANDLE IMAGES ====================
        else if (fileUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
            try {
                console.log('🖼️ [IMAGE] Processing with OCR...');

                const { data: { text } } = await Tesseract.recognize(
                    dataBuffer,
                    'eng',
                    {
                        logger: info => {
                            if (info.status === 'recognizing text') {
                                console.log(`🔍 [OCR] Progress: ${Math.round(info.progress * 100)}%`);
                            }
                        }
                    }
                );

                extractedText = text.replace(/\s+/g, ' ').trim();
                extractionMethod = 'OCR (Image)';
                console.log(`✅ [OCR] Extracted ${extractedText.length} characters from image`);

            } catch (ocrError) {
                console.error('❌ [IMAGE OCR] Failed:', ocrError);
                return res.status(500).json({
                    success: false,
                    message: 'OCR processing failed. Please ensure the image is clear and contains readable text.'
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Unsupported file format. Please upload PDF (text-based) or image (JPG/PNG).'
            });
        }

        // ==================== VALIDATE TEXT ====================
        if (!extractedText || extractedText.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Could not extract sufficient text from document. Please ensure the document contains readable text content.'
            });
        }

        // Sanitize text for API - remove problematic characters
        const sanitizedText = extractedText
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
            .replace(/[""]/g, '"') // Normalize quotes
            .replace(/['']/g, "'") // Normalize apostrophes
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

        console.log('🤖 [GROQ] Sending text to AI for analysis...');

        // ==================== GROQ AI ANALYSIS ====================
        try {
            const groqResponse = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: 'llama-3.1-8b-instant',
                    messages: [
                        {
                            role: 'system',
                                content: `You are an AI-based verification and forensic analysis system for academic leave certificates and supporting documents.

Your task is to critically analyze the provided text (extracted from a PDF/image if applicable) and evaluate BOTH authenticity and credibility.

You must consider ALL of the following dimensions before producing a judgment:

TEXT ORIGIN ANALYSIS
- Linguistic patterns associated with AI-generated text (over-polished grammar, neutral tone, lack of human inconsistency, repetitive phrasing, generic medical/academic language).
- Probability-based wording, symmetry in sentence structure, absence of personal irregularities.
- Compare against common AI-generated templates used for medical/leave certificates.

CONTENT SPECIFICITY CHECK
- Presence of concrete, non-generic details (specific dates, duration, diagnosis/reason, institution names).
- Detection of vague phrases like "personal reasons", "health issues", "due to unavoidable circumstances".
- Consistency between stated reason and duration of leave.

ENTITY VALIDATION LOGIC (NO EXTERNAL LOOKUPS)
- Internal consistency of names (student name, doctor/authority name, institution).
- Phone number structure validity (length, format, country consistency).
- Date logic: issue date, leave start/end date, submission timeline.
- Signature or authority mention plausibility (generic vs role-specific).

DOCUMENT STRUCTURE ANALYSIS
- Whether the document resembles a known template.
- Overly clean formatting or perfectly balanced language.
- Missing imperfections typically found in human-written or scanned certificates.

HANDWRITING / OCR NOISE TOLERANCE (IF TEXT IS OCR-EXTRACTED)
- Penalize clean AI-style conclusions if the rest of the document claims handwritten or scanned origin.
- Allow spelling or grammatical noise as a weak authenticity signal.

GENUINENESS HEURISTICS
- Does the reason align with real-world academic leave patterns?
- Is the explanation proportional to the leave requested?
- Detect excuse inflation or justification padding.

FINAL JUDGMENT RULES
- You are NOT claiming certainty. You are estimating likelihood.
- Confidence must reflect internal consistency, not absolute truth.
- Do not assume malice; assess probability only.

Produce STRICT JSON output only in the following format:

{
  "ai_likelihood": "low | medium | high",
  "confidence": 0-100,
  "reason_genuine": "yes | uncertain | no",
  "notes": "Concise technical justification referencing observed patterns"
}

Do not include explanations outside JSON.
Do not include markdown.
Do not include additional fields.
`
                        },
                        {
                            role: 'user',
                            content: `Analyze this ${extractionMethod} text:\n\n${sanitizedText.substring(0, 2000)}`
                        }
                    ],
                    temperature: 0.2,
                    max_tokens: 600
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            let analysis;
            try {
                const content = groqResponse.data.choices[0].message.content;
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

                if (!analysis.ai_likelihood || analysis.confidence === undefined) {
                    throw new Error('Invalid analysis format');
                }

                console.log(`✅ [GROQ] Analysis complete: ${analysis.ai_likelihood} (${analysis.confidence}% confidence)`);

            } catch (e) {
                console.error('⚠️ [GROQ] Analysis parsing error:', e);
                analysis = {
                    ai_likelihood: 'medium',
                    confidence: 40,
                    reason_genuine: 'uncertain',
                    notes: 'Analysis parsing failed - manual review recommended'
                };
            }

            res.status(200).json({
                success: true,
                data: {
                    student_name: leave.student_id.full_name,
                    roll_no: leave.student_id.roll_no,
                    leave_type: leave.leave_type,
                    document_url: leave.supporting_document_url,
                    extraction_method: extractionMethod,
                    text_length: sanitizedText.length,
                    extracted_text: sanitizedText.substring(0, 400) + (sanitizedText.length > 400 ? '...' : ''),
                    analysis
                }
            });

        } catch (groqError) {
            console.error('❌ [GROQ] API Error:', groqError.response?.data || groqError.message);

            // Return partial success with extracted text but no AI analysis
            return res.status(200).json({
                success: true,
                data: {
                    student_name: leave.student_id.full_name,
                    roll_no: leave.student_id.roll_no,
                    leave_type: leave.leave_type,
                    document_url: leave.supporting_document_url,
                    extraction_method: extractionMethod,
                    text_length: sanitizedText.length,
                    extracted_text: sanitizedText.substring(0, 400) + (sanitizedText.length > 400 ? '...' : ''),
                    analysis: {
                        ai_likelihood: 'unknown',
                        confidence: 0,
                        reason_genuine: 'uncertain',
                        notes: `API Error: ${groqError.response?.data?.error?.message || groqError.message}. Manual review required.`
                    }
                }
            });
        }

    } catch (error) {
        console.error('❌ [ERROR] Verification failed:', error);

        if (error.response?.status === 401) {
            return res.status(500).json({
                success: false,
                message: 'Groq API authentication failed. Please check your GROQ_API_KEY in .env file.'
            });
        }

        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            return res.status(500).json({
                success: false,
                message: 'Request timeout. Please try again.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Document verification failed. Please try again.',
            error: error.message
        });
    }
};
