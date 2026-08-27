import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="text-center">
        <h1 className="font-serif text-5xl">This space does not exist.</h1>
        <Link href="/" className="mt-6 inline-block text-[var(--brass)]">
          Return home
        </Link>
      </div>
    </div>
  );
}
