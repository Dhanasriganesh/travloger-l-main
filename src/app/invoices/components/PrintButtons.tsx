"use client"
import React from 'react'

export default function PrintButtons() {
  return (
    <div className="mt-6 flex justify-end gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
      >
        Print
      </button>
      <button
        type="button"
        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
      >
        Send Mail
      </button>
    </div>
  )
}



