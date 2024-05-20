'use client'

import { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<'button'> & {
    onClick?: () => Promise<void> | void;
}

const Button: React.FC<Props> = ({onClick, ...props}) => {
    return (
        <button {...props} className="bg-blue-500 text-white px-4 py-2 rounded-md" 
        onClick={async () => {
            if (onClick) {
                await onClick();
            }
        }} 
        />
    );
}

export default Button;