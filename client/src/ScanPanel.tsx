import { useState } from 'react'
import { runOCR } from './ocr'
import { useApp } from './store'

export default function ScanPanel() {
  const [frontImg, setFrontImg] = useState<string | undefined>()
  const [backImg, setBackImg] = useState<string | undefined>()
  const [json, setJson] = useState<any>(null)
  const setScanned = useApp((s) => s.setScanned)
  const setFrontTextureUrl = useApp((s) => s.setFrontTextureUrl)
  const setBackTextureUrl = useApp((s) => s.setBackTextureUrl)
  const setName = useApp((s) => s.setName)
  const setNumber = useApp((s) => s.setNumber)

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>, which: 'front' | 'back') => {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    if (which === 'front') setFrontImg(url)
    else setBackImg(url)

    const ocr = await runOCR(f)
    const parsed = ocr.parsed

    // compose JSON
    const payload = {
      cardNumber: parsed.cardNumber,
      cardholderName: parsed.cardholderName,
      bankName: parsed.bankName,
      expiryDate: parsed.expiry,
      cvv: parsed.cvv,
      otherDetails: ocr.lines.join(' | '),
      metadata: { length: f.size, type: f.type },
      textures: { front: which === 'front' ? url : frontImg, back: which === 'back' ? url : backImg },
    }
    setJson(payload)

    // update store for live preview
    setScanned({
      cardNumber: parsed.cardNumber,
      cardholderName: parsed.cardholderName,
      bankName: parsed.bankName,
      expiry: parsed.expiry,
      cvv: parsed.cvv,
      frontTextureUrl: which === 'front' ? url : frontImg,
      backTextureUrl: which === 'back' ? url : backImg,
      otherDetails: ocr.lines.join(' | '),
      metadata: { length: f.size, type: f.type },
    })

    if (parsed.cardholderName) setName(parsed.cardholderName)
    if (parsed.cardNumber) setNumber(parsed.cardNumber)
    if (which === 'front') setFrontTextureUrl(url)
    if (which === 'back') setBackTextureUrl(url)
  }

  return (
    <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.4)', padding: 12, borderRadius: 8, color: '#fff', maxWidth: 360, backdropFilter: 'blur(6px)' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Scan card (OCR)</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <label style={{ display: 'inline-block' }}>
          <input type="file" accept="image/*" onChange={(e) => onFile(e, 'front')} style={{ display: 'none' }} />
          <span style={{ padding: '6px 10px', background: '#2563eb', borderRadius: 6, cursor: 'pointer' }}>Upload front</span>
        </label>
        <label style={{ display: 'inline-block' }}>
          <input type="file" accept="image/*" onChange={(e) => onFile(e, 'back')} style={{ display: 'none' }} />
          <span style={{ padding: '6px 10px', background: '#10b981', borderRadius: 6, cursor: 'pointer' }}>Upload back</span>
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {frontImg && <img src={frontImg} alt="front" style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 4 }} />}
        {backImg && <img src={backImg} alt="back" style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 4 }} />}
      </div>
      {json && (
        <pre style={{ maxHeight: 180, overflow: 'auto', fontSize: 11, background: 'rgba(0,0,0,0.35)', padding: 8, borderRadius: 6 }}>{JSON.stringify(json, null, 2)}</pre>
      )}
    </div>
  )
} 