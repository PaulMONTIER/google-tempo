import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Initialize the embeddings model using Google's text-embedding-004 model
export function getEmbeddings() {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        throw new Error("GOOGLE_API_KEY environment variable is missing for Embeddings.");
    }

    return new GoogleGenerativeAIEmbeddings({
        apiKey: apiKey,
        modelName: "text-embedding-004", // Current recommended embedding model
    });
}
