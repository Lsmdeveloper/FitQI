export default function Terms() {
  return (
    <main className="min-h-[80vh] bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl bg-neutral-900 p-6">
        <h1 className="text-xl font-semibold mb-4">Termos de Uso</h1>

        <p className="text-sm text-gray-300 mb-4">
          Ao utilizar a plataforma FitIQ, você concorda com os termos descritos abaixo.
        </p>

        <div className="space-y-3 text-sm text-gray-400">
          <p>
            • O FitIQ fornece conteúdos informativos e educacionais relacionados
            a bem-estar e hábitos saudáveis.
          </p>
          <p>
            • As informações disponibilizadas não substituem orientação médica
            ou profissional.
          </p>
          <p>
            • O uso da plataforma é de responsabilidade exclusiva do usuário.
          </p>
          <p>
            • O acesso ao conteúdo é pessoal e intransferível.
          </p>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Última atualização: 2026
        </p>
      </div>
    </main>
  );
}
