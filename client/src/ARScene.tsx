import { useEffect, useRef, useState } from 'react'
import { useApp } from './store'

export default function ARScene() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isARReady, setIsARReady] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scanned = useApp((s) => s.scanned)
  const frontTextureUrl = useApp((s) => s.frontTextureUrl)
  const backTextureUrl = useApp((s) => s.backTextureUrl)
  const name = useApp((s) => s.name)
  const number = useApp((s) => s.number)

  useEffect(() => {
    // Check for camera support
    const checkARSupport = async () => {
      try {
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Camera access not supported in this browser')
          return
        }

        // Try to get a test stream to verify camera access
        const testStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        })
        
        // Stop the test stream immediately
        testStream.getTracks().forEach(track => track.stop())
        
        setIsARReady(true)
        setError(null)
      } catch (err) {
        console.error('AR support check failed:', err)
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            setError('Camera permission denied. Please allow camera access.')
          } else if (err.name === 'NotFoundError') {
            setError('No camera found on this device.')
          } else if (err.name === 'NotSupportedError') {
            setError('Camera not supported on this device.')
          } else {
            setError(`Camera error: ${err.message}`)
          }
        } else {
          setError('Unknown camera error occurred.')
        }
      }
    }

    checkARSupport()
  }, [])

  const startAR = async () => {
    if (!videoRef.current || !canvasRef.current) return
    
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'environment' // Use back camera if available
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsStreaming(true)
        
        // Start AR processing
        processAR()
      }
    } catch (err) {
      console.error('Error starting AR:', err)
      if (err instanceof Error) {
        setError(`Failed to start AR: ${err.message}`)
      } else {
        setError('Failed to start AR')
      }
    }
  }

  const stopAR = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsStreaming(false)
    }
  }

  const processAR = () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return
    
    const drawFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Add AR overlay - card information
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(20, 20, 400, 200)
        
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 24px Arial'
        ctx.fillText('AR Card View', 40, 50)
        
        ctx.font = '18px Arial'
        ctx.fillText(`Card: ${number}`, 40, 80)
        ctx.fillText(`Name: ${name}`, 40, 110)
        
        if (scanned?.bankName) {
          ctx.fillText(`Bank: ${scanned.bankName}`, 40, 140)
        }
        if (scanned?.expiry) {
          ctx.fillText(`Expiry: ${scanned.expiry}`, 40, 170)
        }
        if (scanned?.cvv) {
          ctx.fillText(`CVV: ${scanned.cvv}`, 40, 200)
        }
        
        // Add motion tracking indicator
        ctx.fillStyle = '#00ff00'
        ctx.fillRect(canvas.width - 100, 20, 80, 80)
        ctx.fillStyle = '#000000'
        ctx.font = '12px Arial'
        ctx.fillText('TRACKING', canvas.width - 95, 45)
        ctx.fillText('ACTIVE', canvas.width - 95, 60)
      }
      
      if (isStreaming) {
        requestAnimationFrame(drawFrame)
      }
    }
    
    drawFrame()
  }

  const goBack = () => {
    stopAR()
    window.location.reload()
  }

  if (error) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center' }}>
        <div>
          <h2>AR Not Available</h2>
          <p style={{ color: '#ef4444', marginBottom: 20 }}>{error}</p>
          <button onClick={goBack} style={{ padding: '12px 24px', background: '#059669', color: 'white', border: 'none', borderRadius: 6, fontSize: '16px' }}>
            Back to 3D Mode
          </button>
        </div>
      </div>
    )
  }

  if (!isARReady) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Checking AR Support...</h2>
          <p>Please wait while we check your device capabilities</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000, background: '#000' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1001 }}>
        <button onClick={startAR} disabled={isStreaming} style={{ marginRight: 10, padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4 }}>
          Start AR
        </button>
        <button onClick={stopAR} disabled={!isStreaming} style={{ marginRight: 10, padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 4 }}>
          Stop AR
        </button>
        <button onClick={goBack} style={{ padding: '8px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: 4 }}>
          Back to 3D
        </button>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <video
          ref={videoRef}
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            display: isStreaming ? 'block' : 'none'
          }}
          autoPlay
          playsInline
          muted
        />
        
        <canvas
          ref={canvasRef}
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%',
            display: isStreaming ? 'block' : 'none'
          }}
          width={1280}
          height={720}
        />
        
        {!isStreaming && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            color: 'white', 
            textAlign: 'center' 
          }}>
            <h2>AR Card Experience</h2>
            <p>Click "Start AR" to begin camera tracking</p>
            <p>Your card details will be overlaid on the camera feed</p>
            {scanned && (
              <div style={{ marginTop: 20, padding: 20, background: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>
                <h3>Scanned Data:</h3>
                <p>Card: {scanned.cardNumber || number}</p>
                <p>Name: {scanned.cardholderName || name}</p>
                {scanned.bankName && <p>Bank: {scanned.bankName}</p>}
                {scanned.expiry && <p>Expiry: {scanned.expiry}</p>}
                {scanned.cvv && <p>CVV: {scanned.cvv}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 