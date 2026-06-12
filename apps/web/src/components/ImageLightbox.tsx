import { useEffect } from 'react'

interface ImageLightboxProps {
  src: string
  onClose: () => void
}

async function downloadImage(url: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`)
    }
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = `ai-image-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  } catch (error) {
    console.error('下载图片失败:', error)
    alert('下载失败，请右键图片另存为')
  }
}

export function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt="放大查看"
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadImage(src)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
          >
            下载图片
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-800 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
