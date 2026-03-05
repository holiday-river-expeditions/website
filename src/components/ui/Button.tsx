import Link from 'next/link';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'teal';
type ButtonSize = 'default' | 'lg';

interface ButtonBaseProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children: React.ReactNode;
    className?: string;
}

interface ButtonAsButton
    extends
        ButtonBaseProps,
        Omit<
            React.ButtonHTMLAttributes<HTMLButtonElement>,
            keyof ButtonBaseProps
        > {
    href?: never;
}

interface ButtonAsLink extends ButtonBaseProps {
    href: string;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-brand-red text-white hover:bg-brand-red/90',
    secondary: 'bg-blue text-white hover:bg-blue/90',
    outline:
        'border-2 border-brand-red text-brand-red hover:bg-brand-red hover:text-white',
    teal: 'bg-teal text-white hover:bg-river',
};

const sizeStyles: Record<ButtonSize, string> = {
    default: 'px-5 py-2 text-body',
    lg: 'px-8 py-3 text-paragraph',
};

export function Button({
    variant = 'primary',
    size = 'default',
    href,
    children,
    className = '',
    ...rest
}: ButtonProps) {
    const classes =
        `inline-block rounded-lg font-semibold transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim();

    if (href) {
        return (
            <Link href={href} className={classes}>
                {children}
            </Link>
        );
    }

    return (
        <button
            type='button'
            className={classes}
            {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
            {children}
        </button>
    );
}
