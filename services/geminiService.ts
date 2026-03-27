
import { GoogleGenAI, Chat } from "@google/genai";

// Ensure API_KEY is available in the environment.
if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Maintain separate chat instances for different models to preserve history
let flashChat: Chat | null = null;
let liteChat: Chat | null = null;

const getFlashChat = (): Chat => {
    if (!flashChat) {
        flashChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: 'You are a helpful chatbot for the Shield Shield application. Answer user questions about digital identity, privacy, and security concisely.'
            }
        });
    }
    return flashChat;
};

const getLiteChat = (): Chat => {
    if (!liteChat) {
        liteChat = ai.chats.create({
            model: 'gemini-flash-lite-latest', // Corrected model name
            config: {
                systemInstruction: 'You are a fast and brief assistant for the Shield Shield app. Provide quick, low-latency answers.'
            }
        });
    }
    return liteChat;
};

export const getChatResponse = async (prompt: string, mode: 'flash' | 'pro' | 'lite'): Promise<string> => {
    if (!process.env.API_KEY) {
        return "Gemini API key is not configured. Please contact support.";
    }
    try {
        if (mode === 'pro') {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    thinkingConfig: { thinkingBudget: 32768 },
                    systemInstruction: 'You are an advanced security and privacy expert. Provide detailed, thoughtful, and comprehensive answers to complex questions about digital identity, cryptography, and security architecture for the Shield Shield application.'
                }
            });
            return response.text;
        } else if (mode === 'lite') {
            const chat = getLiteChat();
            const response = await chat.sendMessage({ message: prompt });
            return response.text;
        } else { // 'flash'
            const chat = getFlashChat();
            const response = await chat.sendMessage({ message: prompt });
            return response.text;
        }
    } catch (error) {
        console.error("Error fetching Gemini response:", error);
        return "Sorry, I encountered an error. Please try again later.";
    }
};
