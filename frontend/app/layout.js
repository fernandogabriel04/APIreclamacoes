import '../styles/globals.css';

export const metadata = {
    title: 'Sistema de Ouvidoria',
    description: 'Sistema de Ouvidoria população de Maceió',
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
  