"use client";

import Link from "next/link";

type Props = {
  title: string;
  href?: string;
  colorClass: string;
  disabled?: boolean;
};

export default function HomeFeatureCard({
  title,
  href,
  colorClass,
  disabled = false,
}: Props) {
  const baseClasses = `
    w-full h-[54px]
    rounded-2xl
    text-white font-semibold text-[1rem]
    flex items-center justify-center
    text-center
    transition-transform duration-200 ease-in-out
    active:scale-[0.99] hover:scale-[1.02]
    shadow-lg hover:shadow-xl
    ${colorClass}
  `;

  if (disabled || !href) {
    return <div className={`${baseClasses} cursor-default`}>{title}</div>;
  }

  return (
    <Link href={href} className={baseClasses}>
      {title}
    </Link>
  );
}