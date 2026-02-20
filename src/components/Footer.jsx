import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="flex w-full border-t bg-white mt-18 justify-center">
      <div className="mx-auto max-w-3xl px-4 py-6 text-xs text-gray-500 flex flex-col gap-2">
        <div className="flex gap-4 self-center ">
          <Link to="/terms" className="hover:underline">
            Termos
          </Link>
          <Link to="/privacy" className="hover:underline">
            Privacidade
          </Link>
          <Link to="/support" className="hover:text-black">
            Contato
          </Link>
        </div>
        <p>© {new Date().getFullYear()} FitIQ. Todos os direitos reservados.</p>
      </div>
    </footer>
  )
}