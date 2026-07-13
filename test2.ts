import { GoogleGenAI, Part } from "@google/genai";

const ai = new GoogleGenAI({});
async function main() {
    const res = await ai.files.upload({ file: "test.txt", config: { mimeType: "text/plain" } });
    
    // Check if this typechecks:
    const part: Part = {
        fileData: {
            fileUri: res.uri,
            mimeType: res.mimeType
        }
    };
}
