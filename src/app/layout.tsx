import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Upwork Job Planner — AI-Powered Application Strategy',
  description:
    'Analyze Upwork job listings with AI scoring, complexity analysis, and personalized proposal recommendations to maximize your win rate.',
  keywords: ['upwork', 'freelance', 'job planner', 'proposal strategy', 'AI scoring'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="page-wrapper">{children}</div>
      </body>
    </html>
  );
}
