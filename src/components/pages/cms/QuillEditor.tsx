'use client'
import React, { useEffect, useRef } from 'react'
import 'quill/dist/quill.snow.css'

interface Props { 
  value: string
  onChange: (html: string) => void 
}

const QuillEditor: React.FC<Props> = ({ value, onChange }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<HTMLDivElement | null>(null)
  const quillRef = useRef<any>(null)
  const initRef = useRef<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!containerRef.current || !editorRef.current || !toolbarRef.current || quillRef.current) return
    if (initRef.current) return
    initRef.current = true

    import('quill').then((QuillModule) => {
      const Quill = QuillModule.default
      // Do not manually remove children here to avoid React removing twice
      const editor = new Quill(editorRef.current!, {
        theme: 'snow',
        modules: {
          toolbar: {
            container: toolbarRef.current!
          }
        }
      })

      // Force LTR
      const editorRoot = editor.root as HTMLElement
      editorRoot.setAttribute('dir', 'ltr')
      editorRoot.style.direction = 'ltr'
      editorRoot.style.textAlign = 'left'

      // Build toolbar content once
      if (toolbarRef.current && toolbarRef.current.childElementCount === 0) {
        toolbarRef.current.innerHTML = `
          <span class="ql-formats">
            <select class="ql-header">
              <option selected></option>
              <option value="1"></option>
              <option value="2"></option>
              <option value="3"></option>
            </select>
          </span>
          <span class="ql-formats">
            <button class="ql-bold"></button>
            <button class="ql-italic"></button>
            <button class="ql-underline"></button>
          </span>
          <span class="ql-formats">
            <button class="ql-list" value="ordered"></button>
            <button class="ql-list" value="bullet"></button>
          </span>
          <span class="ql-formats">
            <button class="ql-align" value=""></button>
            <button class="ql-align" value="center"></button>
            <button class="ql-align" value="right"></button>
          </span>
          <span class="ql-formats">
            <button class="ql-clean"></button>
          </span>
        `
      }

      editor.root.innerHTML = value || ''
      
      // Auto-resize horizontally based on content
      const autoResize = () => {
        const editorElement = editor.root as HTMLElement
        const container = editorRef.current!
        
        // Get the text content width
        const tempDiv = document.createElement('div')
        tempDiv.style.position = 'absolute'
        tempDiv.style.visibility = 'hidden'
        tempDiv.style.whiteSpace = 'nowrap'
        tempDiv.style.font = window.getComputedStyle(editorElement).font
        tempDiv.textContent = editorElement.textContent || ''
        document.body.appendChild(tempDiv)
        
        const textWidth = tempDiv.offsetWidth
        document.body.removeChild(tempDiv)
        
        // Set container width based on content, with min/max constraints
        const minWidth = 200
        const maxWidth = 800
        const newWidth = Math.max(minWidth, Math.min(maxWidth, textWidth + 40)) // 40px padding
        
        container.style.width = `${newWidth}px`
      }
      
      editor.on('text-change', () => {
        onChange(editor.root.innerHTML)
        // Auto-resize after content changes
        setTimeout(autoResize, 0)
      })
      
      // Initial resize
      setTimeout(autoResize, 100)

      quillRef.current = editor
    })

    return () => {
      if (quillRef.current) {
        quillRef.current = null
      }
      // Avoid manual DOM removal on unmount; React will handle it
      initRef.current = false
    }
  }, [])

  // Update content when value changes externally
  useEffect(() => {
    if (quillRef.current && quillRef.current.root.innerHTML !== value) {
      quillRef.current.root.innerHTML = value || ''
    }
  }, [value])

  return (
    <div ref={containerRef} className="quill-wrap" style={{ direction: 'ltr' }}>
      <style>{`.quill-wrap .ql-toolbar ~ .ql-toolbar{display:none!important}`}</style>
      <div ref={toolbarRef} className="ql-toolbar ql-snow" />
      <div ref={editorRef} className="ql-container ql-snow" style={{ borderTop: 0, height: 'auto', minHeight: '120px' }}>
        <div className="ql-editor" style={{ height: 'auto', minHeight: '120px', overflow: 'hidden' }}></div>
      </div>
    </div>
  )
}

export default QuillEditor

