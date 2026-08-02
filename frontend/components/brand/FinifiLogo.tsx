import Image from 'next/image';
import logoFull from '@/public/logos/logo-finifi-full.png';
import logoIcon from '@/public/logos/logo-finifi-icon.png';
import { cn } from '@/lib/utils';

type FinifiLogoProps = {
  variant?: 'icon' | 'full';
  className?: string;
  priority?: boolean;
};

const variants = {
  icon: {
    src: logoIcon,
    defaultClassName: 'h-10 w-10 object-contain',
  },
  full: {
    src: logoFull,
    defaultClassName: 'h-8 w-auto max-w-[148px] object-contain',
  },
} as const;

export function FinifiLogo({
  variant = 'icon',
  className,
  priority = false,
}: FinifiLogoProps) {
  const asset = variants[variant];

  return (
    <Image
      src={asset.src}
      alt="Finifi"
      priority={priority}
      unoptimized
      className={cn(asset.defaultClassName, className)}
    />
  );
}
