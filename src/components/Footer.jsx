export default function Footer() {
  return (
    <footer className="flex w-full border-t bg-white mt-18 justify-center">
      <div className="mx-auto max-w-3xl px-4 py-6 text-xs text-gray-500 flex flex-col gap-2">
        <div className="flex gap-4 self-center ">
          <a href="/termos" className="hover:text-black">Termos</a>
          <a href="/privacidade" className="hover:text-black">Privacidade</a>
          <a href="/suporte" className="hover:text-black">Contato</a>
        </div>

        <p>© {new Date().getFullYear()} FitIQ. Todos os direitos reservados.</p>
      </div>
    </footer>
  )
}