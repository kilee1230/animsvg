import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SvgGenerationResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const SVG_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    svgCode: {
      type: Type.STRING,
      description:
        "The complete, valid SVG code string with embedded CSS animations or SMIL. Do NOT include markdown backticks.",
    },
    explanation: {
      type: Type.STRING,
      description:
        "A very brief explanation of the animation technique used (1 sentence).",
    },
  },
  required: ["svgCode", "explanation"],
};

const cleanJsonString = (text: string): string => {
  let clean = text.trim();
  // Remove markdown code blocks if present (start and end)
  // Handles ```json ... ```, ``` ... ```, or just the code block
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return clean.trim();
};

const cleanSvgContent = (content: string): string => {
  let clean = content.trim();
  // Sometimes the model puts the SVG inside markdown blocks within the JSON string field
  if (clean.startsWith("```")) {
    clean = clean
      .replace(/^```(?:xml|svg|html)?\s*/i, "")
      .replace(/\s*```$/, "");
  }
  return clean.trim();
};

export const generateOrRefineSvg = async (
  prompt: string,
  currentSvgCode?: string
): Promise<SvgGenerationResponse> => {
  try {
    const model = "gemini-3-pro-preview";

    // Construct a smart system prompt based on user specification
    const systemInstruction = `
      ROLE: Senior Motion Graphics Designer and Principal SVG Engineer
      OBJECTIVE: Generate Dribbble-worthy, production-ready animated SVGs for modern web and product interfaces.

      VISUAL STANDARDS:
      - Style: Modern, Clean, Minimalist, Tech-focused, Subtle glassmorphism and layered depth.
      - Color System:
        - Preferred Palettes: Slate, Indigo, Emerald, Rose, Violet, Neutral Gray.
        - Guidelines: Use gradients and tonal variations. Avoid pure primary colors (red, blue, green).
      - Depth & Polish:
        - Use linearGradient or radialGradient.
        - Apply soft shadows using SVG filters with low opacity.
        - Use opacity layers between 0.6 and 0.95 for hierarchy.
      - Stroke Quality:
        - attributes: stroke-linecap="round", stroke-linejoin="round".
        - Rules: Maintain consistent stroke widths, avoid sharp corners and jagged joins.

      ANIMATION GUIDELINES:
      - Motion Principles:
        - Smooth and fluid motion.
        - Use ease-in-out or cubic-bezier easing.
        - Avoid linear motion unless mechanically justified.
      - Looping:
        - Animations must loop seamlessly.
        - Start and end states must visually match.
      - Techniques:
        - CSS Keyframes: Use inside a <style> tag for movement, scaling, fading, and layered animations.
        - SMIL: Use animate or animateTransform for simple continuous animations, stroke or path effects.
        - Transforms: translate, scale, rotate.

      LOGIC RULES:
      - Modify Existing SVG: If the request is a modification, update the provided 'Existing SVG Code' only.
      - Create New SVG: If the request is a new concept, ignore any existing SVG and create from scratch.

      CRITICAL REQUIREMENTS:
      1. SVG must be animated.
      2. SVG must be responsive with a viewBox (e.g. 0 0 512 512).
      3. Use modern, clean vector aesthetics.
      4. Ensure sufficient contrast and accessibility.
      5. BACKGROUND: The SVG must have a TRANSPARENT background. Do NOT include a <rect> for background color unless explicitly requested by the user.

      OUTPUT RULES:
      - Format: JSON
      - Field 'svgCode': The complete, valid SVG code string.
      - Content: The svgCode field must contain ONLY the raw <svg>...</svg> string.
      - Restrictions: Do NOT wrap SVG in markdown. Do NOT include explanations or comments outside the SVG.

      QUALITY BAR:
      Think like a senior product designer shipping production UI animations suitable for SaaS dashboards, landing pages, and design systems.
    `;

    const contentPrompt = `
      USER PROMPT: "${prompt}"

      ${
        currentSvgCode
          ? `EXISTING SVG CODE (For context/modification):\n${currentSvgCode}`
          : "NO EXISTING SVG (Create from scratch)"
      }
    `;

    const response = await ai.models.generateContent({
      model,
      contents: contentPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: SVG_RESPONSE_SCHEMA,
        temperature: 0.7,
      },
    });

    const text = response.text || "";
    // Clean the output to prevent JSON parse errors if model adds markdown
    const jsonString = cleanJsonString(text);

    if (!jsonString) {
      throw new Error("Empty response from AI");
    }

    const parsed = JSON.parse(jsonString) as SvgGenerationResponse;

    // Post-processing to ensure SVG code is clean inside the JSON object
    parsed.svgCode = cleanSvgContent(parsed.svgCode);

    return parsed;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
};
