const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeMobile(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length >= 12 && digits.startsWith("91")) return digits.slice(-10);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits.slice(0, 10);
}

export function validateName(name) {
  const value = String(name ?? "").trim();
  if (value.length < 2) return "Please enter your full name.";
  return "";
}

export function validateMobile(mobile) {
  const value = normalizeMobile(mobile);
  if (!/^[6-9]\d{9}$/.test(value)) return "Please enter a valid mobile number.";
  return "";
}

export function validateEmail(email) {
  const value = String(email ?? "").trim();
  if (!EMAIL_PATTERN.test(value)) return "Please enter a valid email address.";
  return "";
}

export function validateBooking(customer, termsAccepted = true) {
  const errors = {
    name: validateName(customer?.name),
    mobile: validateMobile(customer?.mobile),
    email: validateEmail(customer?.email),
    terms: termsAccepted ? "" : "Please agree to the terms to continue.",
  };
  const valid = !errors.name && !errors.mobile && !errors.email && !errors.terms;
  return { valid, errors };
}
