'use client';

import { ElementType, PropsWithChildren, useRef } from 'react';
import { useInViewOnce } from '../../hooks/useInViewOnce';

type Props = PropsWithChildren<{
  as?: ElementType;
  className?: string;
  variant?: 'up' | 'left' | 'right';
}>;

export default function Reveal({ children, as: Tag = 'div', className = '', variant = 'up' }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInViewOnce(ref);
  const base = variant === 'left' ? 'reveal-left' : variant === 'right' ? 'reveal-right' : 'reveal';
  return (
    <Tag
      ref={ref}
      className={`${base} text-body ${className} ${inView ? 'in' : ''}`.trim()}
    >
      {children}
    </Tag>
  );
}
