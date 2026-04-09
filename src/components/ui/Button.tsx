import Link from 'next/link';

type ButtonVariant = 'primary' | 'outline' | 'onyx';
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
    primary: 'bg-holiday-red text-holiday-white hover:bg-holiday-red/90',
    outline:
        'border-2 border-holiday-red text-holiday-red hover:bg-holiday-red hover:text-holiday-white',
    onyx: 'bg-onyx text-holiday-white hover:bg-onyx/90',
};

const sizeStyles: Record<ButtonSize, string> = {
    default: 'px-6 py-2 text-link tracking-widest',
    lg: 'px-8 py-3 text-body tracking-widest',
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
        `inline-block rounded-full font-alt-gothic font-medium uppercase transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim();

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
