interface GradientTitleProps {
  children: React.ReactNode;
  className?: string;
}

export default function GradientTitle({
  children,
  className = "",
}: GradientTitleProps) {
  return (
    <h1
      className={`gradient-text text-3xl sm:text-4xl md:text-5xl font-semibold my-6 sm:my-8 md:my-10 py-2 sm:py-3 w-full max-w-sm sm:max-w-md mx-auto text-center leading-tight ${className}`}
    >
      {children}
    </h1>
  );
}