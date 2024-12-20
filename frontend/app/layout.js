import '../styles/globals.css';

export const metadata = {
    title: 'Sistema de Reclamações',
    description: 'Interface para gravação de áudios e envio para o servidor',
  };
  
  export default function RootLayout({ children }) {
    return (
      <html lang="pt-BR">
        <body style={{ margin: 0, fontFamily: 'Arial, sans-serif' }}>
          {children}
        </body>
      </html>
    );
  }
  