## Guia para Incorporar Vídeos com Iframes e Vídeos de Fundo

Este guia fornece instruções sobre como incorporar vídeos do YouTube usando iframes em sua aplicação React e como implementar vídeos de fundo na seção Hero da sua Landing Page.

### 1. Organização de Assets (Imagens e Vídeos)

Recomenda-se colocar seus assets estáticos, como logos, imagens de fundo (se não vierem de URLs externas) e vídeos locais (se optar por auto-hospedagem para o vídeo de fundo) na pasta `public`.

**Estrutura Sugerida:**

```
public/
├── assets/
│   ├── images/
│   │   ├── logo-clan.svg
│   │   └── hero-background-fallback.jpg
│   └── videos/
│       └── hero-background-video.mp4
└── ... (outros arquivos como index.html, favicons)
```

-   **`public/assets/images/`**: Para logos, ícones e imagens estáticas.
-   **`public/assets/videos/`**: Para vídeos auto-hospedados (como o vídeo de fundo da Hero section).

Você pode referenciar esses arquivos diretamente no seu código usando um caminho relativo à pasta `public`. Por exemplo, se você tem `public/assets/images/logo-clan.svg`, no seu componente React, você usaria `<img src="/assets/images/logo-clan.svg" alt="Logo do Clã" />`.

### 2. Incorporando Vídeos do YouTube com Iframes (Seção "GERR em Ação")

Iframes são a maneira padrão de incorporar vídeos do YouTube.

**Componente React `YouTubeEmbed.jsx` (Exemplo):**

Crie um componente reutilizável, por exemplo, `src/components/shared/YouTubeEmbed.jsx`:

```jsx
import React from 'react';

const YouTubeEmbed = ({ videoId, title, className }) => {
  if (!videoId) {
    console.warn("YouTubeEmbed: videoId é obrigatório. Título:", title);
    return (
      <div className={`aspect-video rounded-lg bg-muted flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground p-4 text-center">Vídeo indisponível (ID ausente).</p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&color=red`;

  return (
    <div className={`aspect-video overflow-hidden rounded-lg shadow-xl border border-border/30 group relative ${className}`}>
      <iframe
        width="100%"
        height="100%"
        src={embedUrl}
        title={title || 'Vídeo do YouTube'}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full"
      ></iframe>
    </div>
  );
};

export default YouTubeEmbed;
```

**Uso na sua página (Exemplo em `VideosSection.jsx`):**

```jsx
import React from 'react';
import YouTubeEmbed from '@/components/shared/YouTubeEmbed';
import { motion } from 'framer-motion';
// ... (outras importações e variantes de animação)

const videos = [
  { id: "SEU_VIDEO_ID_1", title: "Gameplay Incrível" },
  { id: "SEU_VIDEO_ID_2", title: "Tutorial Tático" },
  { id: "SEU_VIDEO_ID_3", title: "Melhores Momentos" },
];

const VideosSection = () => {
  return (
    <motion.section 
      className="container mx-auto px-4"
      // ... (props de animação)
    >
      <motion.h2 className="text-4xl md:text-5xl font-arma text-center mb-16 ..." /* ... */>
        GERR em Ação
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {videos.map((video, index) => (
          <motion.div 
            key={video.id + index} 
            // ... (props de animação para cada vídeo)
          >
            <YouTubeEmbed videoId={video.id} title={video.title} />
          </motion.div>
        ))}
      </div>
      {/* ... (botão para canal do YouTube) */}
    </motion.section>
  );
};

export default VideosSection;
```

**Parâmetros da URL do YouTube Embed:**

-   `autoplay=0`: Desabilita o autoplay. Para autoplay, use `1`, mas note que muitos navegadores bloqueiam autoplay com som.
-   `modestbranding=1`: Reduz a marca do YouTube no player.
-   `rel=0`: Não mostra vídeos relacionados ao final.
-   `showinfo=0`: Não mostra o título do vídeo e o uploader antes do vídeo começar.
-   `iv_load_policy=3`: Desabilita anotações de vídeo.
-   `color=red`: Define a cor da barra de progresso (pode ser `red` ou `white`).

**Responsividade:**
A classe `aspect-video` do TailwindCSS (ou CSS `aspect-ratio: 16 / 9;`) no contêiner do iframe ajuda a manter a proporção correta.

### 3. Vídeo de Fundo na Seção Hero (Landing Page)

Para um vídeo de fundo, você tem duas opções principais:
    a.  **Vídeo auto-hospedado usando a tag `<video>` HTML5.**
    b.  **Embed do YouTube/Vimeo (menos comum para fundos puros devido a controles e branding).**

A opção **(a)** geralmente oferece mais controle e melhor desempenho se otimizada corretamente.

**Exemplo com a tag `<video>` HTML5 (dentro do seu componente `HeroSection.jsx`):**

```jsx
import React from 'react';
import { motion } from 'framer-motion';
// ...

const HeroSection = () => {
  const videoPath = "/assets/videos/hero-background-video.mp4"; // Caminho para o vídeo na pasta public
  const fallbackImagePath = "/assets/images/hero-background-fallback.jpg"; // Imagem de fallback

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-start text-left overflow-hidden">
      {/* Vídeo de Fundo */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={fallbackImagePath} // Imagem de placeholder enquanto o vídeo carrega ou se não puder ser reproduzido
          className="w-full h-full object-cover"
          // Para melhor desempenho, forneça múltiplas fontes se tiver diferentes formatos
          // <source src="/assets/videos/hero-background-video.webm" type="video/webm" /> 
        >
          <source src={videoPath} type="video/mp4" />
          Seu navegador não suporta a tag de vídeo.
        </video>
        {/* Overlay para escurecer/estilizar o vídeo */}
        <div className="absolute inset-0 bg-black/50"></div> 
      </div>

      {/* Conteúdo da Hero Section */}
      <motion.div 
        className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16"
        // ... (animações para o conteúdo)
      >
        {/* ... Seu título, parágrafo, botões ... */}
      </motion.div>
    </div>
  );
};

export default HeroSection;
```

**Considerações para Vídeo de Fundo:**

1.  **Desempenho:**
    *   **Compressão:** Comprima o vídeo o máximo possível sem perder muita qualidade. Ferramentas como HandBrake podem ajudar.
    *   **Formato:** Use formatos modernos como MP4 (H.264) e considere WebM para navegadores que o suportam, pois geralmente oferece melhor compressão.
    *   **Resolução:** Não use vídeos com resolução maior que a necessária. Para fundos, 720p ou 1080p geralmente são suficientes.
    *   **Duração:** Mantenha o vídeo curto se for um loop.
2.  **Atributos da Tag `<video>`:**
    *   `autoPlay`: Inicia o vídeo automaticamente.
    *   `loop`: Faz o vídeo repetir.
    *   `muted`: **Essencial** para autoplay na maioria dos navegadores modernos. Vídeos com som não costumam ter permissão para autoplay.
    *   `playsInline`: Necessário para autoplay em iOS.
    *   `poster`: Uma imagem exibida enquanto o vídeo está carregando ou se não puder ser reproduzido.
3.  **CSS para `object-cover`:**
    *   `object-cover` (Tailwind: `object-cover`) garante que o vídeo cubra todo o contêiner, cortando o excesso, similar a `background-size: cover` para imagens.
4.  **Fallback:**
    *   Sempre forneça uma imagem de fundo de fallback (usando `poster` ou CSS) caso o vídeo não carregue ou em dispositivos com conexões lentas.
5.  **Acessibilidade:**
    *   Vídeos de fundo podem ser distrativos. Garanta que o texto sobreposto tenha contraste suficiente.
    *   Considere oferecer uma opção para pausar o vídeo de fundo, especialmente se ele tiver muito movimento.
6.  **Responsividade:**
    *   Teste em diferentes tamanhos de tela. Em telas muito pequenas, um vídeo de fundo pode consumir muitos dados e bateria. Você pode optar por mostrar apenas uma imagem de fallback em dispositivos móveis usando media queries em CSS ou lógica em JavaScript.

Este guia deve ajudá-lo a implementar vídeos de forma eficaz em seu site. Lembre-se de substituir os IDs de vídeo e caminhos de arquivo pelos seus próprios.