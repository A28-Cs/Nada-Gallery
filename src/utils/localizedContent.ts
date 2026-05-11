import i18n from '../i18n';

type LocalizedFields = {
  name?: string;
  description?: string;
  nameAr?: string;
  descriptionAr?: string;
  nameEn?: string;
  descriptionEn?: string;
  translations?: {
    ar?: {
      name?: string;
      description?: string;
    };
    en?: {
      name?: string;
      description?: string;
    };
  };
};

const builtInArabicContent: Record<string, Partial<Record<'name' | 'description', string>>> = {
  'watches': {
    name: 'ساعات',
    description: 'ساعات فاخرة',
  },
  'wallets': {
    name: 'محافظ',
  },
  'belts': {
    name: 'أحزمة',
  },
  'bracelets': {
    name: 'أساور',
  },
  'necklaces': {
    name: 'قلائد',
  },
  'rings': {
    name: 'خواتم',
  },
  'sunglasses': {
    name: 'نظارات شمسية',
  },
  'bags': {
    name: 'حقائب',
  },
  'caps': {
    name: 'قبعات',
  },
  'gift sets': {
    name: 'أطقم هدايا',
  },
};

function normalize(value?: string) {
  return value?.trim().toLowerCase() || '';
}

export function getLocalizedField(
  item: LocalizedFields | null | undefined,
  field: 'name' | 'description',
  language = i18n.language
) {
  if (!item) return '';

  const isArabic = language?.startsWith('ar');
  const baseValue = item[field] || '';

  if (isArabic) {
    const directArabic = field === 'name' ? item.nameAr : item.descriptionAr;
    const translatedArabic = item.translations?.ar?.[field];
    const builtInArabic = builtInArabicContent[normalize(baseValue)]?.[field];
    return directArabic || translatedArabic || builtInArabic || baseValue;
  }

  const directEnglish = field === 'name' ? item.nameEn : item.descriptionEn;
  const translatedEnglish = item.translations?.en?.[field];
  return directEnglish || translatedEnglish || baseValue;
}

export function getLocalizedName(item: LocalizedFields | null | undefined, language = i18n.language) {
  return getLocalizedField(item, 'name', language);
}

export function getLocalizedDescription(item: LocalizedFields | null | undefined, language = i18n.language) {
  return getLocalizedField(item, 'description', language);
}
