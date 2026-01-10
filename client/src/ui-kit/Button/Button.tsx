import type { ComponentPropsWithoutRef } from 'react';

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
    classess?: string
}

export const Button = ({ children, classess = '', type }: ButtonProps) => {
    return <button type={type} className={`button ${classess}`}>
        { children }
    </button>
}