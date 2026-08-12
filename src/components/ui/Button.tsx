import Link from 'next/link';

export type ButtonVariant = 'primary' | 'outline' | 'onyx';
export type ButtonSize = 'default' | 'compact' | 'lg' | 'xl';

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

// Uppercase condensed gothic needs a little tracking to stay legible at button
// sizes, so every size carries some. `lg` gets more because it sits alone as a
// hero CTA where the extra openness reads as deliberate.
const sizeStyles: Record<ButtonSize, string> = {
    default: 'px-6 py-2 text-[19px] leading-none tracking-[0.025em]',
    // Shrinks to fit alongside the logo + hamburger + cart on phones,
    // then matches `default` from md up.
    compact:
        'px-4 py-1.5 text-[16px] leading-none tracking-[0.025em] md:px-6 md:py-2 md:text-[19px]',
    lg: 'px-8 py-2.5 text-[20px] leading-none tracking-[0.05em]',
    xl: 'px-10 py-4 text-[24px] leading-none tracking-[0.025em]',
};

interface ButtonClassOptions {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /**
     * Display utility to emit. Pass 'inline-flex' (or '') when the host element
     * brings its own — Tailwind resolves conflicting utilities by CSS source
     * order, not by their order in the class attribute, so appending a second
     * display class via `className` would win unpredictably.
     */
    display?: string;
    className?: string;
}

/**
 * The single definition of button typography and shape. Exported because
 * several call sites need these styles on an element `Button` can't render —
 * an ExternalLink, a `tel:` anchor, a <summary>. Use `Button` where you can and
 * this where you can't; never hand-roll the string.
 */
export function buttonClasses({
    variant = 'primary',
    size = 'default',
    display = 'inline-block',
    className = '',
}: ButtonClassOptions = {}): string {
    return [
        display,
        'whitespace-nowrap rounded-full font-alt-gothic font-medium uppercase transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className,
    ]
        .filter(Boolean)
        .join(' ')
        .trim();
}

export function Button({
    variant = 'primary',
    size = 'default',
    href,
    children,
    className = '',
    ...rest
}: ButtonProps) {
    const classes = buttonClasses({ variant, size, className });

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
