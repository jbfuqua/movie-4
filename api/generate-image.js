<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Generative Movie Poster AI - Enhanced</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Lato:wght@300;400;700&family=Montserrat:wght@400;700;900&family=Oswald:wght@400;700&family=Poppins:wght@400;600;700&family=Orbitron:wght@700;900&family=Cinzel:wght@600&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Lato', sans-serif;
            background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
        }
        
        .font-oswald { font-family: 'Oswald', sans-serif; }
        .font-bebas { font-family: 'Bebas Neue', sans-serif; }
        .font-montserrat { font-family: 'Montserrat', sans-serif; }
        .font-poppins { font-family: 'Poppins', sans-serif; }
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .font-cinzel { font-family: 'Cinzel', sans-serif; }

        .glass-morphism {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .neon-glow {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }
        
        .poster-glow {
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
        }
        
        .floating {
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        .fade-in {
            animation: fadeIn 0.8s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .pulse-ring {
            animation: pulseRing 2s infinite;
        }
        
        @keyframes pulseRing {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
        }
        
        .gradient-text {
            background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(59, 130, 246, 0.6);
            border-radius: 3px;
        }
        
        @media (max-width: 768px) {
            .floating {
                animation: none;
            }
            
            .glass-morphism {
                backdrop-filter: blur(5px);
            }
            
            button {
                min-height: 44px;
                min-width: 44px;
            }
            
            input, select, textarea {
                font-size: 16px;
            }
        }
        
        canvas {
            will-change: contents;
        }
    </style>
</head>
<body class="text-gray-200 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">

    <div class="w-full max-w-7xl mx-auto">
        <header class="text-center mb-12 fade-in">
            <h1 class="text-5xl sm:text-7xl font-bebas tracking-wider gradient-text mb-4">
                Generative Movie Poster AI
            </h1>
            <p class="text-xl text-gray-400 mb-2">Powered by Advanced AI • Creating Cinematic Art</p>
            <div class="flex justify-center items-center space-x-4 text-sm text-gray-500">
                <span id="status-indicator" class="flex items-center">
                    <div class="w-2 h-2 bg-green-500 rounded-full mr-2 pulse-ring"></div>
                    <span>Ready</span>
                </span>
                <span>•</span>
                <span id="generation-counter">0 posters created</span>
                <span>•</span>
                <span id="auto-timer">Next: Auto</span>
            </div>
        </header>

        <main class="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div class="xl:col-span-3 glass-morphism p-6 rounded-2xl shadow-2xl">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-montserrat font-bold text-white">Current Generation</h2>
                    <div class="flex space-x-2">
                        <button id="save-btn" class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                            Save Poster
                        </button>
                        <button id="share-btn" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                            Share
                        </button>
                    </div>
                </div>
                
                <div id="poster-container" class="w-full max-w-lg mx-auto aspect-[2/3] rounded-xl overflow-hidden poster-glow floating relative">
                    <div id="loader" class="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
                        <div class="text-center">
                            <svg aria-hidden="true" class="w-16 h-16 text-gray-400 animate-spin fill-blue-600 mx-auto mb-4" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C9.08144 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                            </svg>
                            <p id="loading-text" class="text-lg font-medium text-blue-400">Generating concept...</p>
                            <div class="w-64 bg-gray-700 rounded-full h-2 mt-4">
                                <div id="progress-bar" class="bg-blue-600 h-2 rounded-full transition-all duration-500" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                    <img id="poster-image" src="" alt="Generated Movie Poster" class="hidden w-full h-full object-cover">
                </div>
            </div>

            <div class="xl:col-span-1 space-y-6">
                <div class="glass-morphism p-6 rounded-2xl">
                    <h3 class="text-xl font-montserrat font-bold text-white mb-4">Controls</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                          <label class="text-sm font-medium text-gray-300">Hardcore Mode</label>
                          <button id="nod-toggle" class="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600 transition-colors">
                            <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
                          </button>
                        </div>
                        <button id="generate-btn" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none neon-glow">
                            <span id="btn-text">Generate New Poster</span>
                        </button>
                        
                        <div class="flex items-center justify-between">
                            <label class="text-sm font-medium text-gray-300">Auto-generate</label>
                            <button id="auto-toggle" class="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600 transition-colors">
                                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
                            </button>
                        </div>
                        
                        <div>
                            <label class="text-sm font-medium text-gray-300 block mb-2">Genre Filter</label>
                            <select id="genre-filter" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                                <option value="any">Any Genre</option>
                                <option value="horror">Horror</option>
                                <option value="sci-fi">Sci-Fi</option>
                                <option value="fusion">Sci-Fi Horror</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="text-sm font-medium text-gray-300 block mb-2">Era Preference</label>
                            <select id="era-filter" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                                <option value="any">Any Era</option>
                                <option value="1950s">1950s</option>
                                <option value="1960s">1960s</option>
                                <option value="1970s">1970s</option>
                                <option value="1980s">1980s</option>
                                <option value="1990s">1990s</option>
                                <option value="2000s">2000s</option>
                                <option value="2010s">2010s</option>
                                <option value="2020s">2020s</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="text-sm font-medium text-gray-300 block mb-2">Art Style</label>
                            <select id="art-style-filter" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                                <option value="authentic">Era Authentic</option>
                                <option value="b-movie">B-Movie Exaggerated</option>
                                <option value="photo">Modern Photography</option>
                                <option value="painted">Classic Painted Art</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="glass-morphism p-6 rounded-2xl custom-scrollbar max-h-96 overflow-y-auto">
                    <h3 class="text-xl font-montserrat font-bold text-white mb-4">Movie Details</h3>
                    <div id="movie-info" class="space-y-4">
                        <div class="border-l-4 border-blue-500 pl-4">
                            <label class="font-bold text-xs text-gray-400 uppercase tracking-wide">Era</label>
                            <p id="decade-text" class="text-lg text-white font-medium">-</p>
                        </div>
                        <div class="border-l-4 border-purple-500 pl-4">
                            <label class="font-bold text-xs text-gray-400 uppercase tracking-wide">Genre</label>
                            <p id="genre-text" class="text-lg text-white font-medium">-</p>
                        </div>
                        <div class="border-l-4 border-yellow-500 pl-4">
                            <label class="font-bold text-xs text-gray-400 uppercase tracking-wide">Title</label>
                            <p id="title-text" class="text-2xl font-bebas text-yellow-400 leading-tight">-</p>
                        </div>
                        <div class="border-l-4 border-green-500 pl-4">
                            <label class="font-bold text-xs text-gray-400 uppercase tracking-wide">Tagline</label>
                            <p id="tagline-text" class="text-base italic text-gray-300">-</p>
                        </div>
                        <div class="border-l-4 border-red-500 pl-4">
                            <label class="font-bold text-xs text-gray-400 uppercase tracking-wide">Synopsis</label>
                            <p id="synopsis-text" class="text-sm text-gray-200 leading-relaxed">-</p>
                        </div>
                        <div class="border-l-4 border-pink-500 pl-4">
                            <label class="font-bold text-xs text-gray-400 uppercase tracking-wide">Instagram Caption</label>
                            <div class="bg-gray-800 p-3 rounded-lg mt-2">
                                <textarea id="instagram-caption" class="w-full bg-transparent text-xs text-gray-300 resize-none border-none outline-none" rows="6" readonly placeholder="Generate a poster to see Instagram caption..."></textarea>
                                <button id="copy-caption-btn" class="mt-2 px-3 py-1 bg-pink-600 hover:bg-pink-700 rounded text-xs transition-all disabled:opacity-50" disabled>
                                    Copy Caption
                                </button>
                            </div>
                        </div>
                        <div class="border-l-4 border-indigo-500 pl-4">
                            <label class="font-bold text-xs text-gray-400 uppercase tracking-wide">Soundtrack Recommendation</label>
                            <div class="bg-gray-800 p-3 rounded-lg mt-2">
                                <div class="flex items-center space-x-2 mb-2">
                                    <span class="text-lg">🎵</span>
                                    <div>
                                        <p id="song-title" class="text-sm font-medium text-white">-</p>
                                        <p id="song-artist" class="text-xs text-gray-400">-</p>
                                    </div>
                                </div>
                                <p id="song-reason" class="text-xs text-gray-300 italic">-</p>
                                <button id="copy-song-btn" class="mt-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-xs transition-all disabled:opacity-50" disabled>
                                    Copy Song Info
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div id="error-message" class="hidden bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mt-4">
                        <p><strong>Error:</strong> <span id="error-text"></span></p>
                        <button id="retry-btn" class="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm">Retry</button>
                    </div>
                </div>

                <div class="glass-morphism p-6 rounded-2xl">
                    <h3 class="text-xl font-montserrat font-bold text-white mb-4">Recent Generations</h3>
                    <div id="recent-posters" class="grid grid-cols-2 gap-2">
                    </div>
                </div>
            </div>
        </main>
    </div>

    <canvas id="poster-canvas" class="hidden"></canvas>

    <script>
        // Normalize any image string into a safe URL for <img>.src (prevents blockers and canvas taint)
        function normalizeToBlobUrl(maybeBase64OrUrl) {
            try {
                let s = String(maybeBase64OrUrl || '');

                // Already safe?
                if (s.startsWith('blob:') || s.startsWith('data:')) return s;

                // Raw base64 without prefix? Wrap it
                if (!/^https?:\/\//i.test(s) && !s.startsWith('data:')) {
                    s = 'data:image/png;base64,' + s;
                }

                // If still http(s), leave it (server handles CORS/base64); otherwise convert data: → blob:
                if (!s.startsWith('data:')) return s;

                const comma = s.indexOf(',');
                const header = s.slice(0, comma);
                const b64 = s.slice(comma + 1);
                const mimeMatch = /data:(.*?);base64/i.exec(header);
                const mime = (mimeMatch && mimeMatch[1]) || 'image/png';

                const bin = atob(b64);
                const bytes = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

                return URL.createObjectURL(new Blob([bytes], { type: mime }));
            } catch (e) {
                console.warn('normalizeToBlobUrl failed:', e);
                return maybeBase64OrUrl;
            }
        }

        class EnhancedPosterAI {
            constructor() {
                console.log('EnhancedPosterAI constructor called');
                
                this.BACKEND_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') 
                    ? 'http://localhost:3000' 
                    : window.location.origin;
                this.CONCEPT_API_URL = this.BACKEND_BASE_URL + '/api/generate-concept';
                this.IMAGE_API_URL = this.BACKEND_BASE_URL + '/api/generate-image';
                
                this.isGenerating = false;
                this.autoGenerate = false;
                this.generationCount = 0;
                this.autoTimer = null;
                this.recentPosters = [];
                this.currentConcept = null;
                
                this.initializeElements();
                this.setupEventListeners();
                this.setupCanvas();
                this.checkBackendHealth();
            }

            initializeElements() {
                console.log('Initializing DOM elements...');
                this.elements = {
                    generateBtn: document.getElementById('generate-btn'),
                    posterImage: document.getElementById('poster-image'),
                    loader: document.getElementById('loader'),
                    loadingText: document.getElementById('loading-text'),
                    progressBar: document.getElementById('progress-bar'),
                    btnText: document.getElementById('btn-text'),
                    
                    decadeText: document.getElementById('decade-text'),
                    genreText: document.getElementById('genre-text'),
                    titleText: document.getElementById('title-text'),
                    taglineText: document.getElementById('tagline-text'),
                    synopsisText: document.getElementById('synopsis-text'),
                    instagramCaption: document.getElementById('instagram-caption'),
                    copyCaptionBtn: document.getElementById('copy-caption-btn'),
                    songTitle: document.getElementById('song-title'),
                    songArtist: document.getElementById('song-artist'),
                    songReason: document.getElementById('song-reason'),
                    copySongBtn: document.getElementById('copy-song-btn'),
                    
                    autoToggle: document.getElementById('auto-toggle'),
                    nodToggle: document.getElementById('nod-toggle'),
                    genreFilter: document.getElementById('genre-filter'),
                    eraFilter: document.getElementById('era-filter'),
                    artStyleFilter: document.getElementById('art-style-filter'),
                    saveBtn: document.getElementById('save-btn'),
                    shareBtn: document.getElementById('share-btn'),
                    
                    statusIndicator: document.getElementById('status-indicator'),
                    generationCounter: document.getElementById('generation-counter'),
                    autoTimer: document.getElementById('auto-timer'),
                    
                    errorMessage: document.getElementById('error-message'),
                    errorText: document.getElementById('error-text'),
                    retryBtn: document.getElementById('retry-btn'),
                    
                    recentPosters: document.getElementById('recent-posters'),
                    canvas: document.getElementById('poster-canvas')
                };
                
                this.nodTheme = false;
                console.log('DOM elements initialized');
            }

            setupCanvas() {
                const canvas = this.elements.canvas;
                this.ctx = canvas.getContext('2d');
                
                // Set canvas size
                canvas.width = 1024;
                canvas.height = 1280; // 4:5 ratio for Instagram
                
                // Enable high-quality rendering
                this.ctx.imageSmoothingEnabled = true;
                if (this.ctx.imageSmoothingQuality) {