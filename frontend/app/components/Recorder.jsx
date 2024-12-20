"use client";

import React, { useState, useRef, useEffect } from "react";

const Recorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [bairro, setBairro] = useState("Carregando localização...");
  const [bairrosDisponiveis] = useState([
    "Antares",
    "Bebedouro",
    "Benedito Bentes",
    "Bom Parto",
    "Canaã",
    "Centro",
    "Chã da Jaqueira",
    "Chã de Bebedouro",
    "Cidade Universitária",
    "Clima Bom",
    "Cruz das Almas",
    "Eustáquio Gomes",
    "Farol",
    "Fernão Velho",
    "Feitosa",
    "Garça Torta",
    "Gruta de Lourdes",
    "Guaxuma",
    "Ipioca",
    "Jacarecica",
    "Jacintinho",
    "Jardim Petrópolis",
    "Jaraguá",
    "Jatiúca",
    "Levada",
    "Mangabeiras",
    "Mutange",
    "Pajuçara",
    "Pinheiro",
    "Pontal da Barra",
    "Poço",
    "Ponta Verde",
    "Prado",
    "Riacho Doce",
    "Rio Novo",
    "Santa Lúcia",
    "São Jorge",
    "Serraria",
    "Tabuleiro do Martins",
    "Trapiche da Barra",
    "Vergel do Lago",
  ]);
  const [showSelect, setShowSelect] = useState(false);
  const [loading, setLoading] = useState(false); // Indica carregamento
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const getBairroFromCoordinates = async (latitude, longitude) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const bairro =
        data.address.suburb ||
        data.address.neighbourhood ||
        "Bairro não identificado";
      return bairro;
    } catch (error) {
      console.error("Erro ao buscar bairro:", error);
      return "Erro ao identificar bairro";
    }
  };

  const confirmarOuAlterarBairro = async (bairroObtido) => {
    const confirmacao = window.confirm(
      `Você está em "${bairroObtido}". Deseja confirmar este bairro?`
    );

    if (confirmacao) {
      setBairro(bairroObtido);
      localStorage.setItem("bairro", bairroObtido);
    } else {
      setShowSelect(true); // Mostra o select
    }
  };

  const handleBairroSelecionado = (event) => {
    const bairroEscolhido = event.target.value;
    if (bairroEscolhido) {
      setBairro(bairroEscolhido);
      localStorage.setItem("bairro", bairroEscolhido);
      setShowSelect(false); // Esconde o select após a seleção
    }
  };

  const getLocationAndSetBairro = async () => {
    const storedBairro = localStorage.getItem("bairro");
    if (storedBairro) {
      setBairro(storedBairro);
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocalização não suportada pelo navegador.");
      setBairro("Geolocalização não suportada");
      return;
    }

    setLoading(true); // Ativa carregamento
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const bairroObtido = await getBairroFromCoordinates(latitude, longitude);
        confirmarOuAlterarBairro(bairroObtido);
        setLoading(false); // Desativa carregamento
      },
      (error) => {
        console.error("Erro ao acessar localização:", error);
        alert(
          "Não foi possível acessar sua localização. Por favor, configure manualmente."
        );
        setBairro("Bairro não configurado");
        setLoading(false); // Desativa carregamento
      }
    );
  };

  useEffect(() => {
    getLocationAndSetBairro();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: "audio/wav" });
        setAudioBlob(blob);
        audioChunks.current = [];
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      alert("Erro ao acessar o microfone: " + error.message);
    }
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
    setIsRecording(false);
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");

    try {
      const fileIoResponse = await fetch("https://file.io", {
        method: "POST",
        body: formData,
      });

      if (!fileIoResponse.ok) {
        throw new Error("Falha ao fazer upload para file.io");
      }

      const fileIoResult = await fileIoResponse.json();
      console.log("Resposta do file.io:", fileIoResult);

      if (!fileIoResult.success) {
        throw new Error("Upload para file.io falhou.");
      }

      const payload = {
        audio_url: fileIoResult.link,
        tipo: "audio",
        localizacao: bairro,
        origem: "Cabine " + bairro,
      };

    console.log("Payload enviado para a API:", payload);

      const apiResponse = await fetch(process.env.NEXT_PUBLIC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error("Erro da API:", errorData);
        alert(errorData.error || "Erro ao enviar áudio.");
        return;
      }

      const result = await apiResponse.json();
      alert(result.status || "Áudio enviado com sucesso!");
      window.location.reload();
    } catch (error) {
      console.error("Erro ao enviar áudio:", error);
      alert("Houve algum erro. Leia as instruções e tente novamente.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full flex-grow bg-gray-100">
      {loading && <p>Carregando localização...</p>}
      <h2 className="mb-4 text-lg font-bold text-gray-800">Cabine {bairro}</h2>

      {showSelect && (
        <div className="flex flex-col items-center">
          <label htmlFor="bairros" className="text-gray-600 mb-2">
            Escolha o bairro:
          </label>
          <select
            id="bairros"
            onChange={handleBairroSelecionado}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue=""
          >
            <option value="" disabled>
              Selecione um bairro
            </option>
            {bairrosDisponiveis.map((bairro) => (
              <option key={bairro} value={bairro}>
                {bairro}
              </option>
            ))}
          </select>
        </div>
      )}

      {!showSelect && (
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-60 h-60 rounded-full flex items-center justify-center text-white ${
            isRecording ? "bg-red-500" : "bg-green-500"
          } shadow-lg hover:scale-110 transition-transform duration-200`}
        >
          {isRecording ? "Parar" : "Gravar"}
        </button>
      )}

      {audioBlob && (
        <div className="mt-6 flex flex-col items-center">
          <h3 className="text-lg text-gray-600 mb-4">Pré-visualizar áudio:</h3>
          <audio
            controls
            src={URL.createObjectURL(audioBlob)}
            className="w-64"
          />
          <button
            onClick={uploadAudio}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Enviar Áudio
          </button>
        </div>
      )}
    </div>
  );
};

export default Recorder;
