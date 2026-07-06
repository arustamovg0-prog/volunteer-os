import { NextRequest, NextResponse } from 'next/server';
import { requireSessionRequest } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const auth = requireSessionRequest(req, ['admin', 'manager']);
    if ('response' in auth) return auth.response;

    const { title, description, category, tone } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Dynamic SMM post simulation based on tone & category
    let intro = '';
    let callToAction = '';
    let hashtags = '';

    // Tone customizations
    switch (tone) {
      case 'inspiring':
        intro = `✨ Каждое маленькое действие рождает большие перемены! ✨\n\nМы рады пригласить вас на наше новое событие: *${title}*!`;
        callToAction = `🔥 Не упустите шанс стать частью чего-то важного! Регистрируйтесь в Volunteer OS и присоединяйтесь к нашей команде! Ваша энергия способна изменить мир к лучшему! 🌟`;
        break;
      case 'official':
        intro = `📢 Уважаемые волонтеры и партнеры Ассоциации!\n\nИнформируем вас о проведении официального мероприятия: *${title}*.`;
        callToAction = `📋 Просим всех заинтересованных участников подтвердить свое присутствие через личный кабинет волонтера или Telegram-бот. Координация участников начнется за 2 часа до начала.`;
        break;
      case 'emotional':
        intro = `❤️ От сердца к сердцу... Бывают моменты, когда наша поддержка нужна как никогда.\n\nМы открываем сбор участников на событие: *${title}*.`;
        callToAction = `🤝 Подарите немного своего тепла тем, кто в этом нуждается. Ваше присутствие или репост — это неоценимая помощь. Вместе мы сможем преодолеть любые трудности!`;
        break;
      default:
        intro = `📢 Анонс события: *${title}*!`;
        callToAction = `👉 Подробности и регистрация доступны в нашей системе. Присоединяйтесь!`;
    }

    // Category hashtags & content additions
    switch (category) {
      case 'Экология':
        hashtags = '#Экология #ЭкоПатруль #ЗеленыйГород #VolunteerOS #СамараЭкология #ЧистаяПланета';
        break;
      case 'Защита животных':
        hashtags = '#ЗащитаЖивотных #ПомощьПриюту #ДрузьяНашиМеньшие #ЛапаПомощи #КазаньЖивотные';
        break;
      case 'Социальная помощь':
        hashtags = '#СоциальнаяПомощь #ДоброПомощь #АдреснаяПомощь #ВместеСильнее #ЗаботаОБлизких';
        break;
      case 'Здравоохранение':
        hashtags = '#Здравоохранение #ПерваяПомощь #Донорство #БудьЗдоров #КрасныйКрест';
        break;
      case 'Образование':
        hashtags = '#Образование #КомпьютернаяГрамотность #УчитьсяНикогдаНеПоздно #НовыеЗнания';
        break;
      default:
        hashtags = '#Волонтеры #Добро #VolunteerOS #АссоциацияВолонтеров';
    }

    const postContent = `${intro}\n\n📝 *Описание мероприятия:*\n${description}\n\n📍 *Детали проведения:*\n📅 Дата: Будет объявлена в календаре\n🏢 Организатор: Ассоциация Волонтеров\n\n${callToAction}\n\n${hashtags}`;

    return NextResponse.json({
      draft: postContent,
      suggested_time: '12:00 (лучшее время для вовлечения волонтеров)',
      success: true
    });
  } catch (error) {
    console.error('SMM Assistant simulation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
