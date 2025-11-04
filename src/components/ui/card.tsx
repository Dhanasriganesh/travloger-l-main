import * as React from 'react'

export type CardProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className = '', ...props }: CardProps) {
	return <div className={`rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm ${className}`} {...props} />
}

export function CardHeader({ className = '', ...props }: CardProps) {
	return <div className={`p-4 sm:p-5 ${className}`} {...props} />
}

export function CardTitle({ className = '', ...props }: CardProps) {
	return <h3 className={`text-base font-semibold leading-none tracking-tight ${className}`} {...props} />
}

export function CardDescription({ className = '', ...props }: CardProps) {
	return <p className={`text-sm text-gray-500 ${className}`} {...props} />
}

export function CardContent({ className = '', ...props }: CardProps) {
	return <div className={`p-4 sm:p-5 pt-0 ${className}`} {...props} />
}

export function CardFooter({ className = '', ...props }: CardProps) {
	return <div className={`p-4 sm:p-5 pt-0 flex items-center ${className}`} {...props} />
}






