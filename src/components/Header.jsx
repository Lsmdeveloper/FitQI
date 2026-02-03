export default function Header() {
  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <img
            src="../public/blue-logo.png"
            alt="FitIQ"
            className="h-12 w-12"
        />
        <span className="text-lg font-bold">FitIQ</span>

        <a
          href="/suporte"
          className="text-sm text-gray-600 hover:text-black transition"
        >
          Suporte
        </a>
      </div>
    </header>
  )
}
