import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicBlogApi } from '../../services/marketing';
import type { BlogPost } from '../../types';
import {
  Search,
  Eye,
  Clock,
  ArrowRight,
  BookOpen,
  Scale,
  Zap,
  ShieldCheck,
  GraduationCap,
  Lock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Star,
  Users,
  FileText,
  Sparkles,
} from 'lucide-react';

// Categories
const blogCategories = [
  { id: 'all', label: 'Tous les articles', icon: BookOpen, color: 'bg-[#C8A961]' },
  { id: 'juridique', label: 'Juridique', icon: Scale, color: 'bg-green-600' },
  { id: 'productivite', label: 'Productivité', icon: Zap, color: 'bg-blue-600' },
  { id: 'conformite', label: 'Conformité', icon: ShieldCheck, color: 'bg-orange-600' },
  { id: 'tutoriel', label: 'Tutoriels', icon: GraduationCap, color: 'bg-purple-600' },
  { id: 'securite', label: 'Sécurité', icon: Lock, color: 'bg-red-600' },
];

// Authors
const blogAuthors = [
  {
    id: 1,
    name: 'Dr. Aminata Diallo',
    role: 'Experte Juridique OHADA',
    avatar: 'AD',
    color: 'bg-green-500',
  },
  { id: 2, name: 'Marc Kouassi', role: 'Directeur Produit', avatar: 'MK', color: 'bg-[#C8A961]' },
  {
    id: 3,
    name: 'Sophie Mensah',
    role: 'Consultante Conformité',
    avatar: 'SM',
    color: 'bg-orange-500',
  },
  {
    id: 4,
    name: 'Jean-Pierre Ndiaye',
    role: 'Expert Digitalisation',
    avatar: 'JN',
    color: 'bg-purple-500',
  },
];

// Mock blog posts
const mockBlogPosts = [
  {
    id: 1,
    slug: 'signature-electronique-valeur-juridique-afrique',
    title: 'La signature électronique a-t-elle une valeur juridique en Afrique ?',
    excerpt:
      "Découvrez le cadre légal de la signature électronique dans l'espace OHADA et comment elle est reconnue dans 17 pays africains. Guide complet sur la conformité et les bonnes pratiques pour sécuriser vos transactions.",
    content: '',
    category: 'juridique',
    categoryLabel: 'Juridique',
    published_at: '2024-12-15',
    views_count: 12847,
    read_time: '8 min',
    icon: Scale,
    gradient: 'from-green-500 to-emerald-600',
    author: blogAuthors[0],
    featured: true,
    tags: ['OHADA', 'Légal', 'Afrique', 'Signature électronique'],
  },
  {
    id: 2,
    slug: 'digitaliser-processus-validation-entreprise',
    title: '5 étapes pour digitaliser vos processus de validation documentaire',
    excerpt:
      "Transformez vos workflows papier en circuits de validation numériques efficaces. Réduisez vos délais de traitement de 70% grâce à l'automatisation intelligente.",
    content: '',
    category: 'productivite',
    categoryLabel: 'Productivité',
    published_at: '2024-12-10',
    views_count: 8923,
    read_time: '6 min',
    icon: Zap,
    gradient: 'from-blue-500 to-blue-600',
    author: blogAuthors[1],
    featured: false,
    tags: ['Workflow', 'Automatisation', 'ROI', 'Productivité'],
  },
  {
    id: 3,
    slug: 'conformite-eidas-entreprises-internationales',
    title: 'Conformité eIDAS 2.0 : ce que les entreprises doivent savoir en 2025',
    excerpt:
      'Le règlement européen eIDAS évolue avec des changements majeurs. Anticipez les nouvelles exigences et assurez la conformité de vos signatures électroniques.',
    content: '',
    category: 'conformite',
    categoryLabel: 'Conformité',
    published_at: '2024-12-05',
    views_count: 6156,
    read_time: '10 min',
    icon: ShieldCheck,
    gradient: 'from-orange-500 to-amber-600',
    author: blogAuthors[2],
    featured: false,
    tags: ['eIDAS', 'Europe', 'Réglementation', 'Conformité'],
  },
  {
    id: 4,
    slug: 'guide-complet-parapheur-electronique',
    title: 'Guide complet : Maîtriser le parapheur électronique en 10 minutes',
    excerpt:
      "Apprenez à créer, gérer et suivre vos circuits de validation comme un pro. Tutoriel pas à pas avec captures d'écran et astuces d'experts.",
    content: '',
    category: 'tutoriel',
    categoryLabel: 'Tutoriel',
    published_at: '2024-12-01',
    views_count: 15420,
    read_time: '10 min',
    icon: GraduationCap,
    gradient: 'from-purple-500 to-violet-600',
    author: blogAuthors[3],
    featured: false,
    tags: ['Tutoriel', 'Parapheur', 'Guide', 'Formation'],
  },
  {
    id: 5,
    slug: 'securite-documents-sensibles-entreprise',
    title: 'Comment protéger vos documents sensibles : les meilleures pratiques',
    excerpt:
      "Chiffrement, contrôle d'accès, audit trail... Découvrez les stratégies essentielles pour garantir la sécurité de vos documents confidentiels.",
    content: '',
    category: 'securite',
    categoryLabel: 'Sécurité',
    published_at: '2024-11-28',
    views_count: 4832,
    read_time: '7 min',
    icon: Lock,
    gradient: 'from-red-500 to-rose-600',
    author: blogAuthors[2],
    featured: false,
    tags: ['Sécurité', 'Confidentialité', 'RGPD', 'Protection'],
  },
  {
    id: 6,
    slug: 'roi-gestion-documentaire-digitale',
    title: 'Calculer le ROI de votre transformation documentaire digitale',
    excerpt:
      "Méthodes et outils pour mesurer l'impact réel de la dématérialisation sur votre entreprise. Études de cas et calculateur gratuit inclus.",
    content: '',
    category: 'productivite',
    categoryLabel: 'Productivité',
    published_at: '2024-11-25',
    views_count: 3654,
    read_time: '12 min',
    icon: TrendingUp,
    gradient: 'from-cyan-500 to-blue-600',
    author: blogAuthors[1],
    featured: false,
    tags: ['ROI', 'Business', 'Économies', 'Transformation'],
  },
  {
    id: 7,
    slug: 'archivage-electronique-normes-nf-z42-013',
    title: 'Archivage électronique : comprendre la norme NF Z42-013',
    excerpt:
      "Tout savoir sur la norme française d'archivage électronique et comment l'implémenter dans votre organisation pour garantir l'intégrité de vos documents.",
    content: '',
    category: 'conformite',
    categoryLabel: 'Conformité',
    published_at: '2024-11-20',
    views_count: 2891,
    read_time: '9 min',
    icon: ShieldCheck,
    gradient: 'from-orange-500 to-amber-600',
    author: blogAuthors[2],
    featured: false,
    tags: ['Archivage', 'Norme', 'NF Z42-013', 'France'],
  },
  {
    id: 8,
    slug: 'signature-electronique-mobile-bonnes-pratiques',
    title: 'Signature électronique sur mobile : guide des bonnes pratiques',
    excerpt:
      'Comment signer des documents en toute sécurité depuis votre smartphone. Conseils pratiques et pièges à éviter pour une expérience mobile optimale.',
    content: '',
    category: 'tutoriel',
    categoryLabel: 'Tutoriel',
    published_at: '2024-11-15',
    views_count: 5234,
    read_time: '5 min',
    icon: GraduationCap,
    gradient: 'from-purple-500 to-violet-600',
    author: blogAuthors[3],
    featured: false,
    tags: ['Mobile', 'Signature', 'Tutoriel', 'Smartphone'],
  },
  {
    id: 9,
    slug: 'integration-api-signature-electronique',
    title: 'Intégrer une API de signature électronique : guide technique',
    excerpt:
      "Documentation technique complète pour intégrer Advist dans vos applications. Exemples de code, webhooks et bonnes pratiques d'intégration.",
    content: '',
    category: 'tutoriel',
    categoryLabel: 'Tutoriel',
    published_at: '2024-11-10',
    views_count: 4567,
    read_time: '15 min',
    icon: GraduationCap,
    gradient: 'from-purple-500 to-violet-600',
    author: blogAuthors[1],
    featured: false,
    tags: ['API', 'Développeur', 'Intégration', 'Technique'],
  },
];

export const BlogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await publicBlogApi.list();
        if (response.results && response.results.length > 0) {
          setPosts(response.results);
        }
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const displayPosts = posts.length > 0 ? posts : mockBlogPosts;

  // Filter posts
  const filteredPosts = displayPosts.filter((post: any) => {
    const matchesCategory = activeCategory === 'all' || post.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const featuredPost = displayPosts.find((post: any) => post.featured);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setCurrentPage(1);
    if (categoryId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryId);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <header className="bg-[#0A0A0B]/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-decorative text-2xl font-light text-white">Advist</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/#features"
                className="px-4 py-2 text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                Fonctionnalités
              </Link>
              <Link
                to="/#how-it-works"
                className="px-4 py-2 text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                Comment ça marche
              </Link>
              <Link
                to="/#demo"
                className="px-4 py-2 text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                Démo
              </Link>
              <Link
                to="/#pricing"
                className="px-4 py-2 text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                Tarifs
              </Link>
              <Link
                to="/blog"
                className="px-4 py-2 text-sm font-medium text-[#C8A961] bg-[#C8A961]/10 rounded-lg"
              >
                Blog
              </Link>
              <Link
                to="/#contact"
                className="px-4 py-2 text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                Contact
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link to="/select-profile">
                <button className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors">
                  Connexion
                </button>
              </Link>
              <Link to="/register">
                <button className="px-4 py-2 bg-[#C8A961] text-[#0A0A0B] text-sm font-medium rounded-lg hover:bg-[#C8A961]/90 transition-colors">
                  Essai gratuit
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[#0F0F11]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')]" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-[#C8A961]" />
            <span className="text-sm font-medium text-white">Centre de Ressources Advist</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-light text-white mb-6">
            Blog & <span className="text-[#C8A961]">Actualités</span>
          </h1>

          <p className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-10">
            Guides pratiques, analyses d'experts et actualités sur la gestion documentaire, la
            signature électronique et la transformation digitale en Afrique
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                placeholder="Rechercher un article, un sujet..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-12 pr-4 py-4 bg-[#1A1A1D] border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#C8A961]/30 shadow-xl"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            <div className="flex items-center gap-2 text-white/80">
              <FileText className="w-5 h-5" />
              <span className="font-medium">50+</span>
              <span className="text-white/40">Articles</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Eye className="w-5 h-5" />
              <span className="font-medium">125K</span>
              <span className="text-white/40">Lecteurs/mois</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Users className="w-5 h-5" />
              <span className="font-medium">12</span>
              <span className="text-white/40">Experts</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {blogCategories.map((cat) => {
              const IconCat = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeCategory === cat.id
                      ? 'bg-[#C8A961] text-[#0A0A0B] shadow-lg shadow-[#C8A961]/20'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <IconCat className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Featured Article */}
          {featuredPost && activeCategory === 'all' && !searchQuery && currentPage === 1 && (
            <div className="mb-12">
              <article className="group relative bg-[#1A1A1D] rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl border border-white/5 transition-all duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div
                    className={`relative h-64 lg:h-auto bg-gradient-to-br ${(featuredPost as any).gradient || 'from-green-500 to-emerald-600'} overflow-hidden`}
                  >
                    <div className="absolute inset-0">
                      <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white/20 rounded-full" />
                      <div className="absolute bottom-10 right-10 w-48 h-48 border-2 border-white/20 rounded-full" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                    <div className="absolute top-6 left-6 flex items-center gap-2">
                      <span className="px-4 py-2 bg-[#C8A961] text-[#0A0A0B] text-xs font-medium rounded-full shadow-lg flex items-center gap-2">
                        <Star className="w-3.5 h-3.5" />
                        Article vedette
                      </span>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      {(() => {
                        const IconComp = (featuredPost as any).icon || BookOpen;
                        return (
                          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                            <IconComp className="w-12 h-12 text-white" />
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-[#C8A961]/10 text-[#C8A961] text-xs font-medium rounded-full">
                        {(featuredPost as any).categoryLabel}
                      </span>
                      <span className="text-sm text-white/30 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {(featuredPost as any).read_time}
                      </span>
                    </div>

                    <h2 className="text-2xl lg:text-3xl font-light text-white mb-4 group-hover:text-[#C8A961] transition-colors">
                      {(featuredPost as any).title}
                    </h2>

                    <p className="text-white/40 mb-6 leading-relaxed">
                      {(featuredPost as any).excerpt}
                    </p>

                    {(featuredPost as any).author && (
                      <div className="flex items-center gap-3 mb-6">
                        <div
                          className={`w-10 h-10 ${(featuredPost as any).author.color} rounded-full flex items-center justify-center text-white font-bold text-sm`}
                        >
                          {(featuredPost as any).author.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">
                            {(featuredPost as any).author.name}
                          </p>
                          <p className="text-xs text-white/40">
                            {(featuredPost as any).author.role}
                          </p>
                        </div>
                        <span className="ml-auto text-sm text-white/30">
                          {new Date((featuredPost as any).published_at).toLocaleDateString(
                            'fr-FR',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )}
                        </span>
                      </div>
                    )}

                    {(featuredPost as any).tags && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {(featuredPost as any).tags.slice(0, 4).map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-white/5 text-white/60 text-xs font-medium rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <Link
                      to={`/blog/${(featuredPost as any).slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#C8A961] text-[#0A0A0B] rounded-xl font-medium hover:bg-[#C8A961]/90 transition-all w-fit group/btn"
                    >
                      Lire l'article
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            </div>
          )}

          {/* Results info */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-white/40">
              <span className="font-medium text-white">{filteredPosts.length}</span> article
              {filteredPosts.length > 1 ? 's' : ''} trouvé{filteredPosts.length > 1 ? 's' : ''}
              {searchQuery && (
                <span>
                  {' '}
                  pour "<span className="font-medium">{searchQuery}</span>"
                </span>
              )}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-white/40 hover:text-[#C8A961] font-medium"
              >
                Effacer la recherche
              </button>
            )}
          </div>

          {/* Articles Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-[#1A1A1D] rounded-2xl overflow-hidden border border-white/5 animate-pulse"
                >
                  <div className="h-48 bg-white/5" />
                  <div className="p-6">
                    <div className="h-4 bg-white/5 rounded w-1/4 mb-4" />
                    <div className="h-6 bg-white/5 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-white/5 rounded w-full mb-4" />
                    <div className="h-4 bg-white/5 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedPosts.map((post: any) => {
                const IconComp = post.icon || BookOpen;
                return (
                  <article
                    key={post.id}
                    className="group bg-[#1A1A1D] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-white/5 hover:border-white/10 transition-all duration-500"
                  >
                    <div
                      className={`relative h-48 bg-gradient-to-br ${post.gradient || 'from-white/5 to-white/10'} overflow-hidden`}
                    >
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-4 left-4 w-16 h-16 border-2 border-white rounded-full" />
                        <div className="absolute bottom-4 right-4 w-24 h-24 border-2 border-white rounded-full" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          <IconComp className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <span className="absolute top-4 left-4 px-3 py-1.5 bg-[#1A1A1D]/90 text-xs font-medium text-white/80 rounded-full border border-white/10">
                        {post.categoryLabel || post.category}
                      </span>
                      <span className="absolute top-4 right-4 px-3 py-1.5 bg-black/30 backdrop-blur-sm text-xs font-medium text-white rounded-full">
                        {post.read_time}
                      </span>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        {post.author && (
                          <div
                            className={`w-8 h-8 ${post.author.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}
                          >
                            {post.author.avatar}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-medium text-white">{post.author?.name}</p>
                          <p className="text-xs text-white/30">
                            {new Date(post.published_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <span className="text-xs text-white/30 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.views_count?.toLocaleString()}
                        </span>
                      </div>

                      <h3 className="text-lg font-medium text-white mb-3 group-hover:text-[#C8A961] transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="text-white/40 text-sm line-clamp-2 mb-4">{post.excerpt}</p>

                      {post.tags && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {post.tags.slice(0, 3).map((tag: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-white/5 text-white/40 text-xs rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <Link
                        to={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-[#C8A961] hover:text-[#C8A961]/80 transition-colors"
                      >
                        Lire l'article
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white/30" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Aucun article trouvé</h3>
              <p className="text-white/40 mb-6">
                Essayez avec d'autres mots-clés ou explorez nos catégories
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="px-6 py-3 bg-[#C8A961] text-[#0A0A0B] rounded-xl font-medium hover:bg-[#C8A961]/90 transition-colors"
              >
                Voir tous les articles
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-[#C8A961] text-[#0A0A0B]'
                      : 'text-white/60 hover:bg-white/5'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-[#0F0F11]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
            Restez informé des dernières actualités
          </h2>
          <p className="text-white/40 mb-8">
            Recevez nos meilleurs articles et guides directement dans votre boîte mail
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre email"
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#C8A961]/30"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#C8A961] text-[#0A0A0B] font-medium rounded-xl hover:bg-[#C8A961]/90 transition-colors"
            >
              S'abonner
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A0A0B] py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/" className="font-decorative text-xl font-light text-white">
              Advist
            </Link>
            <p className="text-white/30 text-sm">
              © 2025 Advist by Atlas Studio. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6">
              <Link
                to="/legal/privacy"
                className="text-sm text-white/30 hover:text-[#C8A961] transition-colors"
              >
                Confidentialité
              </Link>
              <Link
                to="/legal/cgu"
                className="text-sm text-white/30 hover:text-[#C8A961] transition-colors"
              >
                CGU
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogPage;
