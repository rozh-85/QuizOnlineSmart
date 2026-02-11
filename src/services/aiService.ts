import { GoogleGenerativeAI } from "@google/generative-ai";
import { QuestionType } from "../types";

export interface AIGenOptions {
  apiKey: string;
  lectureTitle: string;
  sourceContent: string;
  type: QuestionType;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
  language: string;
}

const getPreferredModel = async (genAI: GoogleGenerativeAI, testCall: boolean = false) => {
  // A comprehensive list of possible model IDs to try, from newest to oldest
  const models = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
    "gemini-1.0-pro",
    "gemini-pro"
  ];
  
  let errors: string[] = [];
  
  for (const modelId of models) {
    try {
      console.log(`Testing model: ${modelId}`);
      const model = genAI.getGenerativeModel({ model: modelId });
      
      // If we are testing, we actually attempt a tiny generation to verify 404s/403s
      if (testCall) {
        await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
          generationConfig: { maxOutputTokens: 1 }
        });
      }
      
      return { model, modelId };
    } catch (e: any) {
      const errorStr = e.message?.toLowerCase() || "";
      console.warn(`Model ${modelId} failed: ${e.message}`);
      
      // If it's an auth/key error, we should stop immediately
      if (errorStr.includes("api_key") || errorStr.includes("invalid") || errorStr.includes("expired")) {
        throw e;
      }
      
      errors.push(`${modelId}: ${e.message}`);
    }
  }
  
  throw new Error(`No supported Gemini models found. Attempts:\n${errors.join('\n')}\n\nPlease verify your API key has access to these models in Google AI Studio.`);
};

export const generateQuestionsWithAI = async (options: AIGenOptions): Promise<any[]> => {
  const genAI = new GoogleGenerativeAI(options.apiKey);
  
  // We don't pre-test every time for performance, but we handle the retry logic
  const models = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-pro"];
  
  let lastError: any = null;
  
  for (const modelId of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      console.log(`Attempting generation with model: ${modelId}`);

      const prompt = `
        You are an expert educator. Generate ${options.count} ${options.type} questions based on the following lecture content:
        
        Lecture Title: ${options.lectureTitle}
        Difficulty: ${options.difficulty} (easy = foundational, medium = analytical, hard = conceptual)
        Language: ${options.language}
        
        Content:
        ${options.sourceContent}
        
        Format the output as a valid JSON array of objects. Each object must follow this structure:
        {
          "text": "The question text",
          "type": "${options.type}",
          "difficulty": "${options.difficulty}",
          "options": ["Option A", "Option B", "Option C", "Option D"], // Only for multiple-choice or true-false. For true-false it MUST be exactly ["True", "False"].
          "correctIndex": 0, // 0-based index of the correct answer in the options array. Only for MCQ and True/False.
          "correctAnswer": "The exact string for blank", // Only for blank types.
          "explanation": "A short educational explanation"
        }
        
        Return ONLY the JSON array. Do not include markdown formatting or extra text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      
      if (start === -1 || end === -1) {
        throw new Error("Invalid JSON format from AI");
      }

      const jsonStr = text.substring(start, end + 1);
      return JSON.parse(jsonStr);
      
    } catch (error: any) {
      lastError = error;
      const errorStr = error.message?.toLowerCase() || "";
      
      // If it's a 404 or model error, try the next model in the loop
      if (errorStr.includes("not found") || errorStr.includes("404") || errorStr.includes("not supported")) {
        console.warn(`Model ${modelId} failed with 404, moving to next...`);
        continue;
      }
      
      // Otherwise, handle as a normal error
      let errorMessage = `AI Error: ${error.message}`;
      if (errorStr.includes("api_key_invalid")) errorMessage = "Invalid API Key.";
      else if (errorStr.includes("safety")) errorMessage = "Content flagged by safety filters.";
      else if (errorStr.includes("quota")) errorMessage = "API Rate limit exceeded.";
      
      throw new Error(errorMessage);
    }
  }
  
  throw new Error(`Failed all model attempts. Last error: ${lastError?.message}`);
};

export const testGeminiConnection = async (apiKey: string) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const { modelId } = await getPreferredModel(genAI, true); // Perform a real test call
    return `Success! Connected using ${modelId}`;
  } catch (error: any) {
    console.error("Gemini Test Failure:", error);
    throw new Error(error.message || "Connection test failed");
  }
};
