
export const validateIdentityNumber = (idNumber: string): { isValid: boolean; error?: string } => {
  const cleanedId = idNumber.replace(/[.\-]/g, '');

  if (!/^\d{11}$/.test(cleanedId)) {
    return { isValid: false, error: 'Number must contain exactly 11 digits.' };
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
