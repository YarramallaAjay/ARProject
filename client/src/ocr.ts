import Tesseract from 'tesseract.js'

export type OCRResult = {
  rawText: string
  lines: string[]
  parsed: {
    cardNumber?: string
    cardholderName?: string
    bankName?: string
    expiry?: string
    cvv?: string
  }
}

const CARD_NUMBER_REGEX = /(?:\d[ -]?){13,19}/
const EXPIRY_REGEX = /(0[1-9]|1[0-2])\s*[\/\-\.]\s*(\d{2,4})/
const CVV_REGEX = /\b\d{3,4}\b/

export async function runOCR(file: File): Promise<OCRResult> {
  const { data } = await Tesseract.recognize(await file.arrayBuffer(), 'eng', {
    logger: () => {},
  })
  const rawText = data.text || ''
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const joined = lines.join(' ')
  const cardNumber = (joined.match(CARD_NUMBER_REGEX)?.[0] || '').replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim()
  const expiryMatch = joined.match(EXPIRY_REGEX)
  const expiry = expiryMatch ? `${expiryMatch[1]}/${(expiryMatch[2] || '').slice(-2)}` : undefined

  // naive heuristics for name/bank
  const upperLines = lines.filter((l) => /[A-Z]/.test(l) && l === l.toUpperCase())
  const cardholderName = upperLines.find((l) => l.split(' ').length >= 2 && !/BANK|CARD|VALID|THRU|EXP|DATE/.test(l))
  const bankName = upperLines.find((l) => /BANK|CARD|CREDIT|FINANCE|CO-OPERATIVE|COOPERATIVE|CORPORATION/.test(l))

  // CVV only from back images typically; try last numeric token
  const possibleDigits = lines.flatMap((l) => l.split(/\s+/)).filter((t) => /^\d{3,4}$/.test(t))
  const cvv = possibleDigits.reverse().find((t) => t.length === 3 || t.length === 4)

  return {
    rawText,
    lines,
    parsed: { cardNumber: cardNumber || undefined, cardholderName, bankName, expiry, cvv },
  }
} 