import React from "react";

const passos = [
  {
    n: "1",
    titulo: "Confirme seu município",
    texto:
      "Deixe o site identificar sua cidade ou escolha na lista. É assim que sua manifestação chega à região certa.",
  },
  {
    n: "2",
    titulo: 'Toque em "Gravar"',
    texto:
      "Fale de forma clara, com o microfone funcionando. Você tem até 1 minuto para contar o que precisa mudar.",
  },
  {
    n: "3",
    titulo: 'Ouça e toque em "Enviar"',
    texto:
      "Revise seu áudio antes de mandar. Ao enviar, sua mensagem é registrada e encaminhada à equipe de JHC.",
  },
];

const ComoFunciona = () => {
  return (
    <section className="bg-gelo py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="titulo-cartaz text-3xl text-azul-900 sm:text-4xl">
          Como funciona
        </h2>
        <p className="mt-2 max-w-xl font-medium text-slate-600">
          Rápido e direto. Em três passos a sua voz chega até quem vai governar.
        </p>

        <ol className="mt-8 grid gap-5 sm:grid-cols-3">
          {passos.map((p) => (
            <li
              key={p.n}
              className="relative rounded-2xl border-2 border-azul-900/10 bg-white p-6 shadow-sm"
            >
              <span className="titulo-cartaz absolute -top-5 left-5 flex h-12 w-12 items-center justify-center rounded-xl bg-azul-700 text-2xl text-amarelo ring-4 ring-gelo">
                {p.n}
              </span>
              <h3 className="mt-6 text-lg font-extrabold text-azul-900">
                {p.titulo}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {p.texto}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-6 rounded-xl border-l-4 border-laranja bg-white px-4 py-3 text-sm font-medium text-slate-600">
          Atenção: este é um canal de escuta da campanha. Para emergências, use
          190 (Polícia), 192 (SAMU) ou 193 (Bombeiros).
        </p>
      </div>
    </section>
  );
};

export default ComoFunciona;
