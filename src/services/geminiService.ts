import { GoogleGenAI, Type } from "@google/genai";

export interface AnalysisResult {
  manufacturer: string;
  country: string;
  chemicalNature: string;
  purpose: string;
  mediumPolarity: string;
  mediumChemicalNature: string;
  organobentoniteBrands: string;
  bentoniteBaseType: string;
  bentoniteProperties: string;
  surfactantNature: string;
  applicationNotes: string;
  organobentoniteManufacturers: string;
}

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    manufacturer: { type: Type.STRING, description: "Компания производитель продукта" },
    country: { type: Type.STRING, description: "Страна производитель продукта" },
    chemicalNature: { type: Type.STRING, description: "Химическая природа ЛКМ (алкидная, масляная и пр.)" },
    purpose: { type: Type.STRING, description: "Хозяйственное назначение" },
    mediumPolarity: { type: Type.STRING, description: "Полярность дисперсионной среды" },
    mediumChemicalNature: { type: Type.STRING, description: "Химическая природа дисперсионной среды" },
    organobentoniteBrands: { type: Type.STRING, description: "Наиболее вероятные марки (бренды) органобентонита" },
    bentoniteBaseType: { type: Type.STRING, description: "Вероятный тип бентонитовой основы" },
    bentoniteProperties: { type: Type.STRING, description: "Физико-химические свойства этой основы" },
    surfactantNature: { type: Type.STRING, description: "Вероятная химическая природа катионного ПАВ" },
    applicationNotes: { type: Type.STRING, description: "Особенности применения данного органобентонита" },
    organobentoniteManufacturers: { type: Type.STRING, description: "Компании и страны производители органобентонита" },
  },
  required: [
    "manufacturer", "country", "chemicalNature", "purpose", "mediumPolarity",
    "mediumChemicalNature", "organobentoniteBrands", "bentoniteBaseType",
    "bentoniteProperties", "surfactantNature", "applicationNotes", "organobentoniteManufacturers"
  ],
};

const REFERENCE_DATA = `
СПРАВОЧНАЯ ИНФОРМАЦИЯ ИЗ ТЕХНИЧЕСКОГО ОТЧЕТА:

1. Соответствие продуктов и марок органобентонитов:
- Эмаль ПФ-115: Низкая полярность. Рекомендуемые: 801-D, Bentone 34, Claytone 40.
- Грунтовка ГФ-021: Низкая/Средняя полярность. Рекомендуемые: 801-C, BP-181, Bentone 38.
- Эмаль ЭП-140: Высокая полярность. Рекомендуемые: Bentone 27, Claytone APA, Tixogel VZ.
- Эмаль АК-511: Средняя полярность. Рекомендуемые: BP-181, Bentone SD-1.
- Смазки (Литол-24): Очень низкая полярность. Рекомендуемые: Bentone 34, 801-D.
- Эмаль УР-1527: Высокая полярность. Рекомендуемые: Bentone SD-2, Bentone 27.
- Гелькоуты: Средняя полярность. Рекомендуемые: Garamite 1958, Bentone 38.
- Лак НЦ-218: Высокая полярность. Рекомендуемые: Bentone 27, Tixogel VZ, 801-D2.
- Клей 88-Н/88-СА: Средняя полярность. Рекомендуемые: Bentone 38, BP-183, Claytone HY.

2. Характеристики марок органобентонитов:
- Bentone 34 (Elementis, США): Низкая полярность, $4.5-$6.0/кг. Универсальный, нужен активатор.
- Bentone 38 (Elementis, США): Средняя полярность, $5.0-$7.0/кг. На основе гекторита, прозрачный.
- Bentone 27 (Elementis, США): Высокая полярность, $6.5-$8.5/кг. Для ЭП и ПУ систем.
- Bentone SD-1 (Elementis, США): Низкая/Средняя полярность, $8.0-$11.0/кг. Самоактивирующийся (без прегеля).
- Claytone 40 (BYK, Германия): Низкая полярность, $4.0-$5.5/кг. Чистый монтмориллонит Вайоминга.
- 801-D / HT-1 (Китай): Низкая полярность, $1.5-$2.5/кг. Бюджетный, высокая абразивность.
- Garamite 1958 (BYK, Германия): Смешанная полярность, $12.0-$18.0/кг. Гибридная глина, сверхэффективная.

3. Химическая природа ПАВ (ЧАС):
- Низкая полярность: Диметилдистеариламмоний хлорид (Arquad 2HT-75, Noramium M2HT). Длинные цепи C18.
- Средняя полярность: Диметилбензилалкиламмоний (Arquad M2B, Variquat B). Бензильный радикал.
- Высокая полярность: Метилбензилдиалкиламмоний (Ethoquad, Tomamine). -OH группы, циклы.

4. Минеральные основы:
- Бентонит (Монтмориллонит): Диоктаэдрический (Al). Сероватый, дешевый. Вайоминг, Индия.
- Гекторит: Триоктаэдрический (Mg-Li). Белоснежный, прозрачный гель. Калифорния.

5. Технологические рекомендации:
- Низкополярные среды: Обязателен полярный активатор (метанол/вода) или прегель (10% паста).
- Высокополярные среды: Риск переактивации.
- Марки SD: Не требуют активации.
`;

export async function analyzeProduct(input: string | { mimeType: string; data: string }): Promise<AnalysisResult> {
  // В Vite/Vercel это самый надежный способ получить переменную
  // @ts-ignore
  const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.error("GEMINI_API_KEY is missing!");
    throw new Error("API ключ не найден. Пожалуйста: 1. Добавьте VITE_GEMINI_API_KEY в Settings -> Environment Variables на Vercel. 2. Перейдите в Deployments -> Redeploy.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const isImage = typeof input !== "string";
  const model = isImage ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";

  const systemInstruction = `Ты — эксперт-химик в области ЛКМ и реологических добавок. 
Твоя задача — анализировать названия продуктов и изображения этикеток, особенно на русском языке.
Используй предоставленные справочные данные для формирования точных отчетов. 
Если продукт введен на русском языке (например, "ПФ-115", "ГФ-021", "Литол"), сопоставь его с соответствующими техническими характеристиками из справочника.
Если продукт есть в справочнике, приоритетно используй данные оттуда (марки, цены, ПАВ).
Даже если название введено с опечатками или в разговорной форме, постарайся идентифицировать его химическую природу.

ВАЖНО: Весь текст в JSON-ответе должен быть на русском языке.
${REFERENCE_DATA}`;

  const prompt = isImage
    ? "Проанализируй этикетку на этом изображении. Определи продукт (ЛКМ, смазка или клей) и предоставь детальную информацию о его химической природе и подходящих органобентонитах, основываясь на справочных данных."
    : `Проанализируй продукт по названию: "${input}". Определи его химическую природу и предоставь детальную информацию о подходящих органобентонитах, основываясь на справочных данных.`;

  // Функция для выполнения запроса с повторными попытками
  const fetchWithRetry = async (retries = 3, delay = 2000): Promise<any> => {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [
            ...(isImage ? [{ inlineData: input }] : []),
            { text: prompt }
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA,
          // Если это не первая попытка, пробуем без Google Search, так как на него квоты жестче
          tools: retries === 3 ? [{ googleSearch: {} }] : [],
        },
      });
      return response;
    } catch (e: any) {
      const isQuotaError = e.message?.includes("429") || e.message?.includes("RESOURCE_EXHAUSTED");
      if (isQuotaError && retries > 0) {
        console.warn(`Quota exceeded. Retrying in ${delay}ms... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(retries - 1, delay * 2);
      }
      throw e;
    }
  };

  try {
    const response = await fetchWithRetry();
    const text = response.text;
    if (!text) {
      throw new Error("Модель вернула пустой ответ. Возможно, запрос был заблокирован фильтрами безопасности.");
    }

    return JSON.parse(text);
  } catch (e: any) {
    console.error("Gemini Analysis Error:", e);
    if (e.message?.includes("API key")) {
      throw new Error("Ошибка API ключа. Убедитесь, что GEMINI_API_KEY указан верно в настройках Vercel.");
    }
    throw new Error(`Ошибка при анализе: ${e.message || "Неизвестная ошибка"}`);
  }
}
