import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="relative z-[60] w-full border-b bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link to="/">
          <img
              src="/blue-logo.png"
              alt="FitIQ"
              className="h-12 w-12"
          />
        </Link>
        <span className="text-lg font-bold">FitIQ</span>
        <Link to="/support" className="text-sm font-medium">
          Contato
        </Link>
      </div>
    </header>
  )
}
