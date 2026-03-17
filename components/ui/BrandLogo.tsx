type BrandLogoProps = {
  className?: string;
};

export default function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <h1 className={`brand ${className}`.trim()} aria-label="Bravoo">
      Bravoo
    </h1>
  );
}