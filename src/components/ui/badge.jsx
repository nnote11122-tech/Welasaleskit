import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#E14D43]/10 text-[#E14D43]',
        navy: 'bg-[#001a33]/10 text-[#001a33]',
        outline: 'border border-[#001a33]/15 text-[#001a33]/60',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
