import OpenAI from "openai";
import config from "../config";
import { checkRequiredApiKey } from "../config";

// Initialize OpenAI client with API key from config
const openai = new OpenAI({ 
  apiKey: config.ai.openai.apiKey 
});
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = config.ai.openai.defaultModel;

// Helper function to check if OpenAI API is configured
export function isOpenAIConfigured(): boolean {
  return checkRequiredApiKey('openai');
}

/**
 * Translates text to a target language using OpenAI
 * @param text Text to translate
 * @param sourceLanguage Source language code (e.g., 'en', 'ar')
 * @param targetLanguage Target language code
 * @returns Translated text
 */
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the given text from ${sourceLanguage} to ${targetLanguage}. 
                    Maintain the original tone, style, and format. Preserve any special characters, HTML tags, or markup.
                    Return only the translated text without explanations.`,
        },
        { role: "user", content: text },
      ],
      temperature: 0.3, // Lower temperature for more consistent translations
    });

    return response.choices[0].message.content?.trim() || "";
  } catch (error: any) {
    console.error("OpenAI translation error:", error.message);
    throw new Error(`Translation failed: ${error.message}`);
  }
}

/**
 * Translates a key-value object of translations to a target language
 * @param translations Object with translation keys and values
 * @param sourceLanguage Source language code
 * @param targetLanguage Target language code
 * @returns Object with translated values
 */
export async function translateTranslations(
  translations: Record<string, Record<string, string>>,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<Record<string, Record<string, string>>> {
  const result: Record<string, Record<string, string>> = {};

  // Prepare a more efficient batch translation
  const allTranslations: { section: string; key: string; value: string }[] = [];

  // Collect all translations that need to be translated
  Object.entries(translations).forEach(([section, sectionTranslations]) => {
    Object.entries(sectionTranslations).forEach(([key, value]) => {
      if (typeof value === "string") {
        allTranslations.push({ section, key, value });
      }
    });
  });

  // Convert to a format that's easier to translate in one go
  const allTexts = allTranslations.map((item) => item.value);
  const batchSize = 20; // Process in batches to avoid token limits

  try {
    // Process in batches
    for (let i = 0; i < allTexts.length; i += batchSize) {
      const batch = allTexts.slice(i, i + batchSize);

      // Generate structured prompt for batch translation
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the following texts from ${sourceLanguage} to ${targetLanguage}. 
                      Maintain the original tone and meaning. Return a valid JSON array with only the translations in the same order.`,
          },
          {
            role: "user",
            content: JSON.stringify(batch),
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      // Parse the JSON response
      const translatedBatch =
        JSON.parse(response.choices[0].message.content || "{}").translations ||
        [];

      // Reconstruct the translations object with the translated values
      for (let j = 0; j < translatedBatch.length; j++) {
        const index = i + j;
        if (index < allTranslations.length) {
          const { section, key } = allTranslations[index];

          if (!result[section]) {
            result[section] = {};
          }

          result[section][key] = translatedBatch[j];
        }
      }
    }

    return result;
  } catch (error: any) {
    console.error("OpenAI batch translation error:", error.message);
    throw new Error(`Batch translation failed: ${error.message}`);
  }
}

/**
 * Generates content based on a prompt
 * @param prompt The content generation prompt
 * @param contentType Type of content to generate (e.g., 'blog', 'headline', 'product description')
 * @param tone Tone of the content (e.g., 'professional', 'casual', 'friendly')
 * @returns Generated content
 */
export async function generateContent(
  prompt: string,
  contentType: string,
  tone: string,
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert content creator specializing in ${contentType} content.
                    You create content that is ${tone} in tone.
                    Generate high-quality content based on the user's prompt.
                    Focus on being clear, engaging, and properly formatted.
                    Return only the generated content without additional explanations.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content?.trim() || "";
  } catch (error: any) {
    console.error("OpenAI content generation error:", error.message);
    throw new Error(`Content generation failed: ${error.message}`);
  }
}

/**
 * Analyzes text for sentiment, keywords, and readability metrics
 * @param text Text to analyze
 * @returns Analysis results object
 */
export async function analyzeContent(text: string): Promise<{
  sentiment: string;
  keyTerms: string[];
  readabilityScore: number;
  suggestions: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analyze the given text and provide:
                    1. Overall sentiment (positive, negative, or neutral)
                    2. Key terms or phrases (max 5)
                    3. Readability score (1-10, where 10 is easiest to read)
                    4. Improvement suggestions (max 3)
                    Return the results in JSON format.`,
        },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      sentiment: result.sentiment || "neutral",
      keyTerms: result.keyTerms || [],
      readabilityScore: result.readabilityScore || 5,
      suggestions: result.suggestions || [],
    };
  } catch (error: any) {
    console.error("OpenAI analysis error:", error.message);
    throw new Error(`Content analysis failed: ${error.message}`);
  }
}
