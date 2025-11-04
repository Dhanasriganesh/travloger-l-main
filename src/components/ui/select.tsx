import * as React from 'react'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className = '', ...props }: SelectProps) {
	return <select className={`h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`} {...props} />
}






