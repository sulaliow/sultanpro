
import { GoogleGenAI, Type } from "@google/genai";
import { User, AttendanceRecord } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function generateAttendanceInsights(users: User[], records: AttendanceRecord[]) {
  const prompt = `
    حلل بيانات الحضور التالية لشركة "تروس" (Tros) وقدم تقريراً ملخصاً باللغة العربية.
    يجب أن يتضمن التقرير:
    1. معدل الحضور العام.
    2. الموظفون الأكثر انضباطاً.
    3. أي أنماط مثيرة للقلق (تأخرات، عدم تسجيل خروج).
    4. توصيات لمدير الموارد البشرية.

    البيانات:
    الموظفون: ${JSON.stringify(users.map(u => ({ name: u.fullName, dept: u.department })))}
    السجلات: ${JSON.stringify(records.map(r => ({ 
      user: users.find(u => u.id === r.userId)?.fullName, 
      date: r.date, 
      in: r.checkIn, 
      out: r.checkOut 
    })))}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "أنت محلل بيانات موارد بشرية محترف في شركة تروس. قدم رؤى موجزة وقابلة للتنفيذ بناءً على بيانات الحضور، وباللغة العربية الفصحى.",
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "تعذر إنشاء تقرير الذكاء الاصطناعي في الوقت الحالي.";
  }
}
