import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RankMatters – Exam Rank Calculator',
    short_name: 'RankMatters',
    description: 'SSC, RRB, Banking & State exam rank calculators',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#fcfcfc',
    icons: [
      {
        src: '../../public/192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '../../public/512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
