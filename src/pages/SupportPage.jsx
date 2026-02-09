export default function Support() {
  return (
    <main className="min-h-[80vh] bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-neutral-900 p-6 text-white shadow-lg">
        <h1 className="text-xl font-semibold mb-2">Suporte</h1>

        <p className="text-sm text-gray-300 mb-6">
          Precisa de ajuda? Entre em contato com a nossa equipe pelos canais abaixo.
        </p>

        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-700 p-4">
            <p className="text-sm text-gray-400">E-mail</p>
            <p className="font-medium">fitiqteam@gmail.com</p>
          </div>

          <div className="rounded-xl border border-neutral-700 p-4">
            <p className="text-sm text-gray-400">Telefone / WhatsApp</p>
            <p className="font-medium">11 97454-8226</p>
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Atendimento em horário comercial.
        </p>
      </div>
    </main>
  );
}
