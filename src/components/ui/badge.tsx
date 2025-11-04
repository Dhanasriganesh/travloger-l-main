import * as React from 'react'

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
	variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
}

const base = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium'

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
	const styles =
		variant === 'default'
			? 'border-transparent bg-gray-900 text-white'
			: variant === 'secondary'
			? 'border-transparent bg-gray-100 text-gray-900'
			: variant === 'destructive'
			? 'border-transparent bg-red-600 text-white'
			: variant === 'success'
			? 'border-transparent bg-green-600 text-white'
			: 'border-gray-200 text-gray-900'
	return <span className={`${base} ${styles} ${className}`} {...props} />
}




