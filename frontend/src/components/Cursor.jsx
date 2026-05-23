import React, { useEffect, useRef } from 'react'

export default function Cursor() {
  const elRef = useRef(null)
  const pos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const mouse = useRef({ x: pos.current.x, y: pos.current.y })

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
    }

    window.addEventListener('mousemove', onMove)

    let raf = null

    const render = () => {
      // smooth follow
      pos.current.x += (mouse.current.x - pos.current.x) * 0.18
      pos.current.y += (mouse.current.y - pos.current.y) * 0.18

      if (elRef.current) {
        elRef.current.style.left = `${pos.current.x}px`
        elRef.current.style.top = `${pos.current.y}px`
      }

      raf = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={elRef}
      className="pointer-events-none fixed left-0 top-0 z-[9999] transform -translate-x-1/2 -translate-y-1/2"
      aria-hidden="true"
    >
      <div className="cursor-dot w-3 h-3 bg-white/90 rounded-full shadow-md" />
      <div className="cursor-ring absolute left-1/2 top-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
    </div>
  )
}
