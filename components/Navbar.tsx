import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b bg-white">
      <Link href="/" className="text-xl font-bold text-green-800">
        IOTplus
      </Link>

      <div className="flex gap-6 text-sm">
        <Link href="/about">About</Link>
        <Link href="/technology">Technology</Link>
        <Link href="/testbed">Testbed</Link>
        <Link href="/business-model">Business</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/analyze">AI 분석</Link>
        <Link href="/contact">Contact</Link>
      </div>
    </nav>
  );
}
