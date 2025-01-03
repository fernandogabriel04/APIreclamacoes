"use client";

import React, { useState, useRef, useEffect } from "react";

const Recorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
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
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudioWithWebAudio = async (blob) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      source.start(0);
      source.onended = () => {
        setIsPlaying(false); // Atualiza o estado quando o áudio termina
      };

      setIsPlaying(true);
    } catch (error) {
      console.error("Erro ao reproduzir áudio com Web Audio API:", error);
    }
  };

  const handlePlayAudio = () => {
    if (audioBlob) {
      playAudioWithWebAudio(audioBlob);
    }
  };
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
      setShowSelect(true);
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
        console.error("Erro ao acessar localização, selecione o bairro da Cabine:", error);
        setShowSelect(true); // Mostra o select se houver erro ao obter localização
        setLoading(false); // Desativa carregamento
      }
    );
  };

  useEffect(() => {
    getLocationAndSetBairro();
  }, []);

  // Contador
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => {
          if (prevTime >= 60) {
            stopRecording();
            alert("O limite de gravação de 1 minuto foi atingido.");
            return prevTime;
          }
          return prevTime + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording]);

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
      setRecordingTime(0);
    } catch (error) {
      alert("Erro ao acessar o microfone: " + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);

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
      window.location.reload();
    } finally {
      setIsProcessing(false); // Desativa o estado de processamento
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full flex-grow bg-gray-100">
      {loading && <p>Carregando localização...</p>}
      <h2 className="mb-4 text-lg font-bold text-gray-800"> {bairro !== "Carregando localização..." && bairro ? `Cabine ${bairro}` : "Carregando localização..."}</h2>
  
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
        <>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-60 h-60 rounded-full flex items-center justify-center text-white ${
            isRecording ? "bg-red-500" : "bg-green-500"
          } shadow-lg hover:scale-110 transition-transform duration-200`}
        >
          {isRecording ? "Parar" : "Gravar"}
        </button>
        <p className="mt-4 text-lg text-gray-700">
        Tempo de gravação: {formatTime(recordingTime)}
        </p>
        </>
      )}
  
      {audioBlob && (
        <div className="mt-6 flex flex-col items-center">
          <h3 className="text-lg text-gray-600 mb-4">Pré-visualizar áudio:</h3>
          {audioBlob && (
            <button
              onClick={handlePlayAudio}
              disabled={isPlaying}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {isPlaying ? "Reproduzindo..." : "Reproduzir Áudio"}
            </button>
          )}
          <button
            onClick={uploadAudio}
            disabled={isProcessing} // Desativa o botão quando está processando
            className={`mt-4 px-4 py-2 rounded-lg transition-colors ${
              isProcessing
                ? "bg-gray-500 text-white cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {isProcessing ? "Processando..." : "Enviar Áudio"}
          </button>
        </div>
      )}
    </div>
  );  
};

export default Recorder;
