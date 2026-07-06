import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSessionRequest } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 1. Summarization logic (extract key point in 1-2 sentences)
    let summary = '';
    const cleanText = text.toLowerCase();

    if (cleanText.includes('научить') || cleanText.includes('компьютер')) {
      summary = 'Запрос на участие или информацию по курсам компьютерной грамотности для пожилых людей.';
    } else if (cleanText.includes('помощь приюту') || cleanText.includes('собак') || cleanText.includes('кош')) {
      summary = 'Обращение касательно волонтерства или помощи приюту для бездомных животных в Казани.';
    } else if (cleanText.includes('ширин') || cleanText.includes('директор') || cleanText.includes('руководител')) {
      summary = 'Личное или срочное обращение, адресованное руководителю ассоциации Ширин.';
    } else if (cleanText.includes('перчатк') || cleanText.includes('пакет') || cleanText.includes('инвентар')) {
      summary = 'Запрос о наличии или выдаче рабочего инвентаря/расходников для эко-патруля.';
    } else if (cleanText.includes('как стать') || cleanText.includes('кодекс') || cleanText.includes('правила')) {
      summary = 'Вопрос о правилах вступления в организацию или кодексе волонтера.';
    } else {
      summary = text.length > 60 ? text.substring(0, 60) + '...' : text;
    }

    // 2. Classification logic
    let classification: 'faq' | 'team' | 'shirin' = 'team';
    let reply = '';

    if (cleanText.includes('ширин') || cleanText.includes('директор') || cleanText.includes('лично')) {
      classification = 'shirin';
      reply = 'Сообщение перенаправлено в личную папку руководителя ассоциации Ширин. Она ответит вам при первой возможности.';
    } else if (
      cleanText.includes('как стать') || 
      cleanText.includes('правила') || 
      cleanText.includes('где посмотреть') || 
      cleanText.includes('инструкция') ||
      cleanText.includes('кодекс')
    ) {
      classification = 'faq';
      
      // Match with Knowledge Base if possible
      const kb = await db.getKBArticles();
      const match = kb.find(item => 
        item.title.toLowerCase().includes('кодекс') || 
        item.title.toLowerCase().includes('инструкция')
      );
      
      if (match) {
        reply = `Вот информация из Базы знаний по вашему запросу:\n\n**${match.title}**\n${match.content.substring(0, 300)}...`;
      } else {
        reply = 'Для получения информации о правилах вступления в волонтеры ознакомьтесь с разделом Базы Знаний "Инструкции".';
      }
    } else {
      classification = 'team';
      reply = 'Ваше обращение передано дежурному координатору проектов. Мы свяжемся с вами в течение часа.';
    }

    return NextResponse.json({
      classification,
      summary,
      reply,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Gatekeeper simulation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
