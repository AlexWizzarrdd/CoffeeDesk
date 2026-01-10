export const isValidPhone = (phone: string) => {
    const pattern = /\+7\d{10}\b/;
    return pattern.test(phone);
}

export const isValidName = (value: string) => {
  const v = value.trim();
  // минимум 2 символа, только буквы (RU/EN) и дефис
  return /^[A-Za-zА-Яа-яЁё-]{2,}$/.test(v);
};