import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

export const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

export async function clinicalChat(
  history: Array<{ role: 'user' | 'model'; text: string }>,
  message: string,
  userRole: string = 'STAFF'
): Promise<string> {
  if (!ai) {
    return `[Offline Clinical AI Fallback] AURA Health Assistant is operating in local heuristic mode. For patient triage, prioritize hemodynamic stability, oxygen saturation, and bed availability. Role context: ${userRole}.`;
  }

  try {
    const contents = history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction: `You are AURA Clinical Intelligence, an advanced AI hospital co-pilot inside the Smart Hospital Resource Optimization & Management System.
You assist hospital staff (Doctors, Nurses, Administrators) and Patients with clinical workflows, bed allocation protocols, triage scoring (Emergency Severity Index), pharmaceutical dosing queries, resource optimization advice, and hospital guidelines.
Current user role: ${userRole}.
Guidelines:
- Maintain a professional, concise, empathetic, and clinically sound tone.
- When answering triage or bed queries, emphasize critical care safety rules (e.g. ventilator requirements, ICU step-down criteria).
- Do not make definitive unsupervised surgical decisions; recommend consultation with attending physicians.`,
        temperature: 0.7,
      }
    });

    return response.text || 'No response generated.';
  } catch (err: unknown) {
    console.error('Gemini chat error:', err);
    return `AURA Assistant temporary notice: ${((err as Error).message || 'Unable to process clinical request at this moment.')}`;
  }
}

export async function transcribeAudio(base64Audio: string, mimeType: string = 'audio/webm'): Promise<string> {
  if (!ai) {
    return 'Dictation audio received. Simulated transcription: Patient presents with mild intermittent chest discomfort and stable vitals.';
  }

  try {
    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: base64Audio,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          { text: 'Accurately transcribe this medical doctor dictation / clinical consultation audio into text verbatim. Include clinical terms, medication dosages, and vital signs clearly.' }
        ]
      },
    });

    return response.text || '';
  } catch (err: unknown) {
    console.error('Audio transcription error:', err);
    throw new Error(`Audio transcription error: ${(err as Error).message}`);
  }
}
