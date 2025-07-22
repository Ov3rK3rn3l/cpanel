import React from 'react';
import PropTypes from 'prop-types';

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

YouTubeEmbed.propTypes = {
  videoId: PropTypes.string.isRequired,
  title: PropTypes.string,
  className: PropTypes.string,
};

export default YouTubeEmbed;