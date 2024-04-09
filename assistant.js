import fs from 'fs';
import axios from 'axios';
import { OpenAI } from 'openai';
import PDFParser from 'pdf-parse';

// Set your OpenAI API key (store securely using environment variables)
const OPENAI_API_KEY = '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';
const OPENAI_ENGINE = 'davinci';

// Initialize OpenAI API client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Function to parse PDF and extract text
function parsePDF(pdfPath) {
  return new Promise((resolve, reject) => {
    try {
      const pdfBuffer = fs.readFileSync(pdfPath);
      PDFParser(pdfBuffer).then(data => {
        resolve(data.text);
      }).catch(error => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Function to upload text to OpenAI's file storage
async function uploadTextToOpenAI(text) {
  try {
    const response = await axios.post('https://api.openai.com/v1/files', {
      purpose: 'search',
      file: {
        data: Buffer.from(text).toString('base64'),
        name: 'pdf_text.txt',
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    });

    return response.data.id;
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    return null;
  }
}

// Function to search for information in the uploaded text
async function searchText(query, textFileId) {
  const prompt = `In the following text, find the information related to "${query}"\n\nText: ${textFileId}`;

  try {
    const response = await openai.completions.create({
      engine: OPENAI_ENGINE,
      prompt: prompt,
      max_tokens: 150,
    });

    return response;
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    return null;
  }
}

// Main function
async function main() {
  const pdfPath = "C:\\Users\\ASUS\\Downloads\\21BEC1007.pdf";

  console.log('Parsing PDF...');
  try {
    const pdfText = await parsePDF(pdfPath);

    console.log('Uploading parsed text to OpenAI...');
    const textFileId = await uploadTextToOpenAI(pdfText);
    if (!textFileId) {
      console.error('Failed to upload text to OpenAI.');
      return;
    }
    console.log('Text uploaded. File ID:', textFileId);

    const query = 'when is cat 2?';

    console.log(`Searching for "${query}"...`);
    const searchResults = await searchText(query, textFileId);

    if (searchResults && searchResults.data && searchResults.data.length > 0) {
      console.log('Search Results:');
      console.log(searchResults.data.choices[0].text);
    } else {
      console.log('No results found.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the main function
main();
