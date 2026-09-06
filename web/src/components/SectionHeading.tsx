interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export default function SectionHeading({ title, subtitle, centered = false }: SectionHeadingProps) {
  return (
    <div className={`mb-12 ${centered ? "text-center" : "text-left"}`}>
      <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-foreground/70 max-w-2xl mx-auto font-medium">
          {subtitle}
        </p>
      )}
      <div className={`h-1 w-20 bg-primary mt-6 rounded-full ${centered ? "mx-auto" : ""}`} />
    </div>
  );
}
