// ─────────────────────────────────────────────────────────────────────────────
// Точные переводы для анкеты волонтёра на трёх языках
// ─────────────────────────────────────────────────────────────────────────────

export const i18n = {

  // ── ШАГ 1: Выбор языка ──────────────────────────────────────────────────
  // Всегда на узбекском латинице (независимо от языка)
  reg_welcome: {
    RUS: 'Assalomu Aleykum!\nIltimos tilni tanlang. / Please choose the language. / Пожалуйста, выберите язык.',
    UZB: 'Assalomu Aleykum!\nIltimos tilni tanlang. / Please choose the language. / Пожалуйста, выберите язык.',
    ENG: 'Assalomu Aleykum!\nIltimos tilni tanlang. / Please choose the language. / Пожалуйста, выберите язык.'
  },
  reg_choose_lang: {
    RUS: 'Пожалуйста, выберите язык, нажав на одну из кнопок.',
    UZB: 'Iltimos, quyidagi tugmalardan birini bosib tilni tanlang.',
    ENG: 'Please select a language by clicking one of the buttons below.'
  },

  // ── ШАГ 2: ФИО по паспорту ──────────────────────────────────────────────
  reg_name: {
    RUS: 'Пожалуйста, введите вашу фамилию, имя и отчество в соответствии с данными, указанными в паспорте.',
    UZB: 'Iltimos, pasportingizdagi ma\'lumotlarga muvofiq familiya, ism va otasining ismini kiriting.',
    ENG: 'Please enter your last name, first name and middle name as stated in your passport.'
  },

  // ── ШАГ 3: Поделиться контактом ─────────────────────────────────────────
  reg_contact: {
    RUS: 'Пожалуйста поделитесь своим контактом (нажмите кнопку ниже)',
    UZB: 'Iltimos, kontaktingizni ulashing (quyidagi tugmani bosing)',
    ENG: 'Please share your contact (click the button below)'
  },
  reg_contact_btn: {
    RUS: '📱 Поделиться контактом',
    UZB: '📱 Kontaktni ulashish',
    ENG: '📱 Share contact'
  },

  // ── ШАГ 4: Ручной ввод номера ───────────────────────────────────────────
  reg_phone: {
    RUS: 'Пожалуйста, отправьте ваш номер телефона для связи с вами.',
    UZB: 'Iltimos, siz bilan bog\'lanish uchun telefon raqamingizni yuboring.',
    ENG: 'Please send your phone number so we can contact you.'
  },
  reg_contact_error: {
    RUS: 'Пожалуйста, поделитесь контактом с помощью кнопки или введите номер телефона вручную.',
    UZB: 'Iltimos, tugma orqali kontaktingizni yuboring yoki telefon raqamingizni qo\'lda kiriting.',
    ENG: 'Please share your contact using the button or enter your phone number manually.'
  },

  // ── ШАГ 5: Проекты (мульти-выбор) ──────────────────────────────────────
  reg_projects: {
    RUS: 'На какой проект (инициативу) вы подаётесь?\n(Можно выбрать несколько вариантов ответа)',
    UZB: 'Qaysi loyiha (tashabbus) uchun ariza topshiryapsiz?\n(Bir nechta variantni tanlash mumkin)',
    ENG: 'Which project (initiative) are you applying for?\n(You can choose multiple options)'
  },
  reg_projects_added: {
    RUS: (p: string) => `✅ Выбрано: ${p}\nВыберите ещё или нажмите «Далее»`,
    UZB: (p: string) => `✅ Tanlandi: ${p}\nYana tanlang yoki «Keyingisi» ni bosing`,
    ENG: (p: string) => `✅ Selected: ${p}\nSelect more or click «Next»`
  },
  reg_projects_empty: {
    RUS: 'Пожалуйста, выберите хотя бы один проект.',
    UZB: 'Iltimos, kamida bitta loyihani tanlang.',
    ENG: 'Please select at least one project.'
  },

  // ── ШАГ 6: Языки (мульти-выбор) ─────────────────────────────────────────
  reg_skills: {
    RUS: 'На каких языках вы свободно общаетесь?\n(Можно выбрать несколько вариантов ответа)\n\nЕсли хотите указать другой язык — напишите его текстом.',
    UZB: 'Qaysi tillarda erkin muloqot qilasiz?\n(Bir nechta variantni tanlash mumkin)\n\nBoshqa til ko\'rsatmoqchi bo\'lsangiz — matn yozing.',
    ENG: 'Which languages do you speak fluently?\n(You can choose multiple options)\n\nIf you want to specify another language — type it.'
  },
  reg_skills_added: {
    RUS: (lang: string) => `✅ Добавлен язык: ${lang}\nВыберите ещё или нажмите «Далее»`,
    UZB: (lang: string) => `✅ Til qo'shildi: ${lang}\nYana tanlang yoki «Keyingisi» ni bosing`,
    ENG: (lang: string) => `✅ Language added: ${lang}\nSelect more or click «Next»`
  },
  reg_skills_empty: {
    RUS: 'Пожалуйста, выберите хотя бы один язык или напишите его текстом.',
    UZB: 'Iltimos, kamida bitta tilni tanlang yoki yozing.',
    ENG: 'Please select at least one language or type it.'
  },

  // ── ШАГ 7: Здоровье/условия (мульти-выбор) ──────────────────────────────
  reg_health: {
    RUS: 'Для нас важно создать комфортные и безопасные условия для каждого волонтёра. Если для вашего участия в волонтёрской деятельности необходимы дополнительные условия или есть особенности здоровья, которые следует учитывать, пожалуйста, отметьте подходящий(ие) вариант(ы).\n(Можно выбрать несколько вариантов ответа)',
    UZB: 'Har bir ko\'ngilli uchun qulay va xavfsiz sharoit yaratish bizning uchun muhim. Agar ko\'ngillilik faoliyatida ishtirokingiz uchun qo\'shimcha sharoitlar zarur bo\'lsa yoki hisobga olinishi kerak bo\'lgan sog\'liq xususiyatlari mavjud bo\'lsa, iltimos, mos variantni/variantlarni belgilang.\n(Bir nechta variantni tanlash mumkin)',
    ENG: 'It is important for us to create comfortable and safe conditions for every volunteer. If you need additional conditions to participate in volunteering or have health features that should be taken into account, please mark the appropriate option(s).\n(You can choose multiple options)'
  },
  reg_health_added: {
    RUS: (item: string) => `✅ Отмечено: ${item}\nВыберите ещё или нажмите «Далее»`,
    UZB: (item: string) => `✅ Belgilandi: ${item}\nYana tanlang yoki «Keyingisi» ni bosing`,
    ENG: (item: string) => `✅ Marked: ${item}\nSelect more or click «Next»`
  },
  reg_health_other_prompt: {
    RUS: 'Пожалуйста, укажите ваши особенности или необходимые условия:',
    UZB: 'Iltimos, o\'zingizning xususiyatlaringizni yoki zarur sharoitlarni ko\'rsating:',
    ENG: 'Please specify your conditions or special requirements:'
  },
  reg_health_empty: {
    RUS: 'Пожалуйста, выберите хотя бы один вариант.',
    UZB: 'Iltimos, kamida bitta variantni tanlang.',
    ENG: 'Please select at least one option.'
  },

  // ── ШАГ 8: Источник (откуда узнали) ─────────────────────────────────────
  reg_referral: {
    RUS: 'Укажите, пожалуйста, откуда вы узнали о нашем боте?\n\nНапишите имя и инициативу (проект) человека, который отправил вам ссылку.',
    UZB: 'Iltimos, botimiz haqida qayerdan bildingiz?\n\nSizga havola yuborgan shaxsning ismini va tashabbus (loyiha) nomini yozing.',
    ENG: 'Please tell us how you found out about our bot?\n\nWrite the name and initiative (project) of the person who sent you the link.'
  },

  // ── ШАГ 9: Финальное сообщение ──────────────────────────────────────────
  reg_success: {
    RUS: `✅ Спасибо за ваши ответы!
Ваша заявка успешно передана администратору для проверки.
Пожалуйста, ожидайте завершения верификации.

Добрые дела не ждут. ❤️
Делайте добро там, где вы есть: дома, во дворе, в своей махалле, там где учитесь или работаете. А чтобы быть в курсе новых волонтерских возможностей и инициатив, заходите на платформу UVA.`,
    UZB: `✅ Javoblaringiz uchun rahmat!
Arizangiz tekshirish uchun administratorga muvaffaqiyatli yuborildi.
Iltimos, tasdiqlash yakunlanishini kuting.

Yaxshi ishlar kutmaydi. ❤️
Qayerda bo'lsangiz yaxshilik qiling: uyda, hovlida, mahallangizda, o'qiyotgan yoki ishlayotgan joyingizda. Yangi ko'ngillilik imkoniyatlari va tashabbuslaridan xabardor bo'lish uchun UVA platformasiga kiring.`,
    ENG: `✅ Thank you for your answers!
Your application has been successfully submitted to the administrator for review.
Please wait for the verification to be completed.

Good deeds don't wait. ❤️
Do good wherever you are: at home, in the yard, in your mahalla, where you study or work. To stay informed about new volunteering opportunities and initiatives, visit the UVA platform.`
  },

  // ── Общие кнопки ────────────────────────────────────────────────────────
  btn_yes: { RUS: '✅ Да', UZB: '✅ Ha', ENG: '✅ Yes' },
  btn_no:  { RUS: '❌ Нет', UZB: '❌ Yo\'q', ENG: '❌ No' }
};

export function t(key: string, lang: string = 'RUS', ...args: any[]): string {
  const translations = (i18n as any)[key];
  if (!translations) return key;
  const translation = translations[lang] || translations['RUS'] || key;
  if (typeof translation === 'function') {
    return translation(...args);
  }
  return translation;
}
