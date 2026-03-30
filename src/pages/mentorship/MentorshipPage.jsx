import React, { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, PlayCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DashboardHeader from '@/components/DashboardHeader'; // Ensure this is imported
import { useAiAssistant } from '@/contexts/AiAssistantContext';

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <Loader2 className="w-12 h-12 animate-spin text-primary" />
  </div>
);

const VideoPlayerModal = ({ video, open, onOpenChange }) => {
  if (!video) return null;

  const getYouTubeEmbedUrl = (url) => {
    try {
      const urlObj = new URL(url);
      let videoId = urlObj.searchParams.get('v');
      if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
    } catch (error) {
      console.error("Invalid YouTube URL:", error);
      return null;
    }
  };

  const embedUrl = getYouTubeEmbedUrl(video.youtube_url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black border-0">
        <DialogHeader className="p-4">
          <DialogTitle className="text-white">{video.title}</DialogTitle>
        </DialogHeader>
        <div className="aspect-video">
          {embedUrl ? (
            <iframe
              width="100%"
              height="100%"
              src={embedUrl}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
              URL do vídeo inválida.
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-300">{video.description}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const VideoCard = ({ video, onClick, index }) => {
  const getYouTubeThumbnail = (url) => {
    try {
      const urlObj = new URL(url);
      let videoId = urlObj.searchParams.get('v');
      if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      }
      return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
    } catch {
      return '';
    }
  };

  const thumbnailUrl = getYouTubeThumbnail(video.youtube_url);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => onClick(video)}
      className="group relative w-full min-w-[250px] aspect-video rounded-lg overflow-hidden cursor-pointer shadow-lg transform hover:scale-105 transition-transform duration-300"
    >
      <img className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-75" alt={video.title} src={thumbnailUrl || "https://images.unsplash.com/photo-1567443024551-f3e3cc2be870"} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <PlayCircle className="w-16 h-16 text-white/80" />
      </div>
      <div className="absolute bottom-0 left-0 p-3">
        <h3 className="font-semibold text-white text-md leading-tight">{video.title}</h3>
      </div>
    </motion.div>
  );
};

const Section = ({ section, onVideoClick }) => (
  <div className="mb-12">
    <h2 className="text-2xl font-bold text-foreground mb-4 px-4 md:px-6">{section.title}</h2>
    <div className="flex overflow-x-auto space-x-4 pb-4 px-4 md:px-6 custom-scrollbar">
      {section.videos.map((video, index) => (
        <VideoCard key={video.id} video={video} onClick={onVideoClick} index={index} />
      ))}
    </div>
  </div>
);

const MentorshipPage = () => { 
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('mentorship_sections')
          .select('*, videos:mentorship_videos(*)')
          .order('order', { ascending: true })
          .order('order', { foreignTable: 'mentorship_videos', ascending: true });

        if (sectionsError) throw sectionsError;
        setSections(sectionsData);
      } catch (error) {
        console.error('Error fetching mentorship data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const filteredSections = sections
    .map(section => ({
      ...section,
      videos: section.videos.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }))
    .filter(section => section.videos.length > 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader /> 

      <main className="flex-1 pt-20 py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold text-gradient">Mentoria</h1> {/* Page title */}
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Buscar treinamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingFallback />
        ) : (
          <AnimatePresence>
            {filteredSections.map((section) => (
              <Section key={section.id} section={section} onVideoClick={handleVideoClick} />
            ))}
          </AnimatePresence>
        )}
        {filteredSections.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nenhum vídeo encontrado para "{searchTerm}".</p>
          </div>
        )}
      </main>

      <Suspense fallback={null}>
        <VideoPlayerModal video={selectedVideo} open={isModalOpen} onOpenChange={setIsModalOpen} />
      </Suspense>
    </div>
  );
};

export default MentorshipPage;