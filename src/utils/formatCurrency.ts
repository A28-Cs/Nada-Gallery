import i18n from '../i18n';

export function formatCurrency(amount: number): string {
  const isArabic = i18n.language?.startsWith('ar');
  
  if (isArabic) {
    const formattedAmount = new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formattedAmount} جنيه`;
  }

  return `EGP ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
