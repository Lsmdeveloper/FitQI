export default function Privacy() {
  return (
    <main className="min-h-[80vh] bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl bg-neutral-900 p-6">
        <h1 className="text-xl font-semibold mb-4">Política de Privacidade</h1>

        <p className="text-sm text-gray-300 mb-4">
          A sua privacidade é importante para nós.
        </p>

        <div className="space-y-3 text-sm text-gray-400">
          <p>
            • Coletamos apenas informações necessárias para processar pagamentos
            e entregar nossos serviços.
          </p>
          <p>
            • Seus dados não são vendidos ou compartilhados com terceiros,
            exceto quando necessário para processamento de pagamento.
          </p>
          <p>
            • Utilizamos ferramentas seguras para proteger suas informações.
          </p>
          <p>
            • Você pode solicitar a exclusão dos seus dados a qualquer momento.
          </p>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Última atualização: 2026
        </p>
      </div>
    </main>
  );
}
