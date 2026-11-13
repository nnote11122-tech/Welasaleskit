import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-black tracking-widest uppercase transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        default: 'bg-[#E14D43] text-white shadow-lg hover:brightness-110',
        outline: 'border-2 border-[#001a33]/15 bg-transparent text-[#001a33] hover:bg-[#001a33] hover:text-white',
        ghost: 'text-[#001a33]/60 hover:text-[#001a33] hover:bg-[#001a33]/5',
        navy: 'bg-[#001a33] text-white hover:bg-[#001a33]/80',
      },
      size: {
        default: 'h-12 px-8 py-3',
        sm: 'h-9 px-5 text-xs',
        lg: 'h-14 px-12 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
})
Button.displayName = 'Button'

export { Button, buttonVariants }
