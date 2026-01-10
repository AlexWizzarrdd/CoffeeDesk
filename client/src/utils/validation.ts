export const isValidPhone = (phone: string) => {
    const pattern = /\+7\d{10}\b/;
    return pattern.test(phone);
}

export const isValidName = (name: string) => {
    const pattern = /^[A-z]+$/i;
    return pattern.test(name)
}