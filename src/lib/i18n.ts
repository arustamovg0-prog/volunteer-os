export const i18n = {
  reg_name: {
    RUS: 'Введите ваше Имя и Фамилию:',
    UZB: 'Ism va familiyangizni kiriting:',
    ENG: 'Please enter your Full Name:'
  },
  reg_choose_lang: {
    RUS: 'Пожалуйста, выберите язык, нажав на одну из кнопок.',
    UZB: 'Iltimos, tugmalardan birini bosib tilni tanlang.',
    ENG: 'Please select a language by clicking one of the buttons.'
  },
  reg_dob: {
    RUS: 'Введите дату рождения в формате ДД.ММ.ГГГГ:',
    UZB: 'Tug\'ilgan kuningizni KK.OO.YYYY formatida kiriting:',
    ENG: 'Enter your date of birth in DD.MM.YYYY format:'
  },
  reg_age_min: {
    RUS: 'Извините, минимальный возраст для волонтерства — 16 лет. Ваша регистрация остановлена.',
    UZB: 'Kechirasiz, ko\'ngilli bo\'lish uchun minimal yosh — 16 yosh. Ro\'yxatdan o\'tish to\'xtatildi.',
    ENG: 'Sorry, the minimum age for volunteering is 16. Your registration has been stopped.'
  },
  reg_age_max: {
    RUS: 'Извините, максимальный возраст для волонтерства — 50 лет. Ваша регистрация остановлена.',
    UZB: 'Kechirasiz, ko\'ngilli bo\'lish uchun maksimal yosh — 50 yosh. Ro\'yxatdan o\'tish to\'xtatildi.',
    ENG: 'Sorry, the maximum age for volunteering is 50. Your registration has been stopped.'
  },
  reg_dob_error: {
    RUS: 'Неверный формат. Пожалуйста, введите дату в формате ДД.ММ.ГГГГ',
    UZB: 'Noto\'g\'ri format. Iltimos, sanani KK.OO.YYYY formatida kiriting',
    ENG: 'Invalid format. Please enter the date in DD.MM.YYYY format'
  },
  reg_contact: {
    RUS: 'Пожалуйста, поделитесь своим контактом (нажмите кнопку ниже):',
    UZB: 'Iltimos, aloqa raqamingizni yuboring (quyidagi tugmani bosing):',
    ENG: 'Please share your contact (click the button below):'
  },
  reg_contact_btn: {
    RUS: '📱 Поделиться контактом',
    UZB: '📱 Kontaktni yuborish',
    ENG: '📱 Share contact'
  },
  reg_contact_error: {
    RUS: 'Пожалуйста, поделитесь контактом с помощью кнопки.',
    UZB: 'Iltimos, tugma yordamida kontaktni yuboring.',
    ENG: 'Please share your contact using the button.'
  },
  reg_skills: {
    RUS: 'Ваши языковые навыки на уровне разговорной речи. Выберите один или несколько вариантов, затем нажмите "Далее".\nЕсли хотите добавить "Другие", просто напишите их текстом:',
    UZB: 'Og\'zaki nutq darajasidagi til ko\'nikmalaringiz. Bir yoki bir nechta variantni tanlang, so\'ng "Keyingisi" ni bosing.\nAgar "Boshqa" qo\'shmoqchi bo\'lsangiz, shunchaki matn yozing:',
    ENG: 'Your language skills at a conversational level. Choose one or more options, then click "Next".\nIf you want to add "Other", just type it in text:'
  },
  reg_skills_btn_uzb: { RUS: 'Узбекский', UZB: 'O\'zbek tili', ENG: 'Uzbek' },
  reg_skills_btn_rus: { RUS: 'Русский', UZB: 'Rus tili', ENG: 'Russian' },
  reg_skills_btn_eng: { RUS: 'Английский', UZB: 'Ingliz tili', ENG: 'English' },
  reg_skills_btn_next: { RUS: '➡️ Далее', UZB: '➡️ Keyingisi', ENG: '➡️ Next' },
  reg_skills_empty: {
    RUS: 'Пожалуйста, выберите хотя бы один язык или напишите текстом.',
    UZB: 'Iltimos, kamida bitta tilni tanlang yoki matn yozing.',
    ENG: 'Please select at least one language or type it in text.'
  },
  reg_skills_added: {
    RUS: (lang: string) => `✅ Добавлен язык: ${lang}. Выберите еще или нажмите "Далее".`,
    UZB: (lang: string) => `✅ Til qo'shildi: ${lang}. Yana tanlang yoki "Keyingisi" ni bosing.`,
    ENG: (lang: string) => `✅ Language added: ${lang}. Select more or click "Next".`
  },
  reg_disability: {
    RUS: 'Имеется ли у вас инвалидность?',
    UZB: 'Sizda nogironlik bormi?',
    ENG: 'Do you have a disability?'
  },
  btn_yes: { RUS: 'Да', UZB: 'Ha', ENG: 'Yes' },
  btn_no: { RUS: 'Нет', UZB: 'Yo\'q', ENG: 'No' },
  reg_disability_success: {
    RUS: '✅ Заявка отправлена на расмотрение!',
    UZB: '✅ Ariza ko\'rib chiqish uchun yuborildi!',
    ENG: '✅ Application submitted for review!'
  },
  reg_disability_error: {
    RUS: 'Пожалуйста, выберите Да или Нет, используя кнопки.',
    UZB: 'Iltimos, tugmalardan foydalanib Ha yoki Yo\'q ni tanlang.',
    ENG: 'Please select Yes or No using the buttons.'
  },
  reg_disability_cat: {
    RUS: 'Выберите категорию Инвалидности или напишите свой вариант текстом:',
    UZB: 'Nogironlik toifasini tanlang yoki o\'z variantingizni yozing:',
    ENG: 'Select a Disability category or type your own option:'
  },
  cat_vision: { RUS: 'Нарушения зрения', UZB: 'Ko\'rish qobiliyatining buzilishi', ENG: 'Vision impairment' },
  cat_hearing: { RUS: 'Нарушения слуха', UZB: 'Eshitish qobiliyatining buzilishi', ENG: 'Hearing impairment' },
  cat_mobility: { RUS: 'Нарушения опорно-двигательного аппарата', UZB: 'Tayanch-harakat apparati buzilishlari', ENG: 'Mobility impairment' },
  cat_speech: { RUS: 'Нарушения речи', UZB: 'Nutqning buzilishi', ENG: 'Speech impairment' },
  cat_mental: { RUS: 'Ментальные и интеллектуальные нарушения', UZB: 'Aqliy va intellektual buzilishlar', ENG: 'Mental and intellectual impairment' },
  cat_psych: { RUS: 'Психические заболевания', UZB: 'Ruhiy kasalliklar', ENG: 'Psychiatric disorders' },
  cat_somatic: { RUS: 'Соматические заболевания', UZB: 'Somatik kasalliklar', ENG: 'Somatic diseases' },
  cat_multiple: { RUS: 'Множественные нарушения', UZB: 'Ko\'p turdagi buzilishlar', ENG: 'Multiple impairments' }
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
