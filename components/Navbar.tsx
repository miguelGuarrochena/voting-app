import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-sky-500 text-xl font-bold">
              Pickly
            </Link>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <Link href="/" className="text-slate-700 hover:text-sky-500 px-3 py-2 text-sm font-medium">
              Home
            </Link>
            <Link href="/create" className="bg-sky-100 text-sky-700 hover:bg-sky-200 px-4 py-2 rounded-md text-sm font-medium">
              Create
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
