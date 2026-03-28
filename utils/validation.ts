
export const validateIdentityNumber = (idNumber: string): { isValid: boolean; error?: string } => {
  const cleanedId = idNumber.replace(/[.\-]/g, '');

  if (!/^\d{11}$/.test(cleanedId)) {
    return { isValid: false, error: 'Number must contain exactly 11 digits.' };
  }

  if (/^(\d)\1{10}$/.test(cleanedId)) {
    return { isValid: false, error: 'Number cannot consist of all identical digits.' };
  }

  const digits = cleanedId.split('').map(Number);

  // Calculate first check digit
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += digits[i] * (10 - i);
  }
  let remainder1 = (sum1 * 10) % 11;
  if (remainder1 === 10) {
    remainder1 = 0;
  }

  if (remainder1 !== digits[9]) {
    return { isValid: false, error: 'Invalid identity number. First check digit is incorrect.' };
  }

  // Calculate second check digit
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += digits[i] * (11 - i);
  }
  let remainder2 = (sum2 * 10) % 11;
  if (remainder2 === 10) {
    remainder2 = 0;
  }

  if (remainder2 !== digits[10]) {
    return { isValid: false, error: 'Invalid identity number. Second check digit is incorrect.' };
  }

  return { isValid: true };
};

export const validateStrongPassword = (password: string): { isValid: boolean; error?: string } => {
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long.' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must include at least one uppercase letter.' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must include at least one lowercase letter.' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must include at least one number.' };
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return { isValid: false, error: 'Password must include at least one special character.' };
  }

  return { isValid: true };
};
