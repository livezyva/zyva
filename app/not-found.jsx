import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="min-h-screen bg-zbg grid place-items-center px-6">
      <div className="text-center">
        <div className="font-headline text-7xl text-zneon font-bold">404</div>
        <div className="text-ztext2 mt-2">This event faded into the night.</div>
        <Link href="/" className="inline-flex mt-6 items-center gap-2 bg-zneon text-black font-bold px-5 py-2.5 rounded-full">
          Back to discover
        </Link>
      </div>
    </div>
  );
}
