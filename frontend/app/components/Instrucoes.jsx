import React from "react";

const Instrucoes = () => {
  return (
    <div className="flex flex-col justify-start items-center w-full p-4 md:bg-gray-200 rounded-md shadow-lg">
      <h2 className="text-lg font-bold text-gray-700 mb-4">Instruções</h2>
      <p className="text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 text-justify">
        Certifique-se de que o microfone está funcionando corretamente antes de começar.
      </p>
      <p className="text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 mb-2 text-justify">
        O aúdio precisa ser referente ao município de Maceió, estamos aqui para te ouvir!
      </p>
      <p className="text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 mb-2 text-justify">
        1. Clique no botão <span className="text-green-500 font-semibold">"Gravar"</span> para iniciar a gravação.
      </p>
      <p className="text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 mb-2 text-justify">
        2. Após finalizar a gravação, clique no botão <span className="text-red-500 font-semibold">"Parar"</span>.
      </p>
      <p className="text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 mb-2 text-justify">
        3. Você poderá ouvir o áudio gravado e enviá-lo clicando no botão <span className="text-blue-500 font-semibold">"Enviar Áudio"</span>.
      </p>
    </div>
  );
};

export default Instrucoes;
