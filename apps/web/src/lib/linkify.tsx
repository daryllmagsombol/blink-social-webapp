import Link from 'next/link';

export function linkifyCaption(caption: string | null) {
  if (!caption) return null;

  const parts = caption.split(/(#\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      const tag = part.slice(1);
      return (
        <Link
          key={i}
          href={`/tags/${tag}`}
          className="text-primary font-semibold hover:underline"
        >
          {part}
        </Link>
      );
    }
    return part;
  });
}
