export function createMathCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const useAdd = Math.random() > 0.5;
  const prompt = useAdd ? `${a} + ${b}` : `${a + b} - ${b}`;
  const answer = useAdd ? a + b : a;
  return { prompt, answer: String(answer) };
}

export function verifyCaptcha(inputValue, expected) {
  return String(inputValue || "").trim() === String(expected || "").trim();
}
