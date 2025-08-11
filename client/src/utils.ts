export function formatCardNumber(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 16)
  const groups = digits.match(/.{1,4}/g) || []
  return groups.join(' ')
}

export function luhnCheck(num: string): boolean {
  const digits = num.replace(/\s+/g, '')
  if (digits.length < 12) return false
  let sum = 0
  let shouldDouble = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10)
    if (shouldDouble) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
} 