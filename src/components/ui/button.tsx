import * as React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link'
	size?: 'sm' | 'md' | 'lg' | 'icon'
}

const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none'

export function Button({ className = '', variant = 'default', size = 'md', ...props }: ButtonProps) {
	const variantClass =
		variant === 'default'
			? 'bg-gray-900 text-white hover:bg-gray-800'
			: variant === 'secondary'
			? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
			: variant === 'outline'
			? 'border border-gray-200 hover:bg-gray-50'
			: variant === 'ghost'
			? 'hover:bg-gray-50'
			: 'text-blue-600 underline-offset-4 hover:underline'

	const sizeClass =
		size === 'sm' ? 'h-8 px-3' : size === 'lg' ? 'h-11 px-8' : size === 'icon' ? 'h-9 w-9' : 'h-9 px-4'

	return <button className={`${base} ${variantClass} ${sizeClass} ${className}`} {...props} />
}






