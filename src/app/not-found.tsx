"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

// Snake Game Component
function SnakeGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<{
    snake: Array<{ x: number; y: number }>;
    direction: { x: number; y: number };
    nextDirection: { x: number; y: number };
    bug: { x: number; y: number } | null;
    cellSize: number;
    maxSize: number;
    maxSizeReachedAt: number | null;
  }>({
    snake: [{ x: 15, y: 15 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    bug: null,
    cellSize: 20,
    maxSize: 0,
    maxSizeReachedAt: null,
  });

  const [snake, setSnake] = useState<Array<{ x: number; y: number }>>([{ x: 15, y: 15 }]);
  const [bug, setBug] = useState<{ x: number; y: number } | null>(null);
  const [score, setScore] = useState(0);
  const [maxSize, setMaxSize] = useState(0);
  const [maxSizeReachedAt, setMaxSizeReachedAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showRickRoll, setShowRickRoll] = useState(false);
  const [tongueOut, setTongueOut] = useState(false);
  const gameStartTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateBug = useRef((gridWidth: number, gridHeight: number, currentSnake: Array<{ x: number; y: number }>) => {
    let attempts = 0;
    let newBug: { x: number; y: number };
    do {
      newBug = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight),
      };
      attempts++;
      if (attempts > 100) break; // Safety limit
    } while (
      currentSnake.some((segment) => segment.x === newBug.x && segment.y === newBug.y)
    );

    if (newBug) {
      setBug(newBug);
      gameRef.current.bug = newBug;
    }
  }).current;

  useEffect(() => {
    if (!containerRef.current || showRickRoll) return;

    const container = containerRef.current;
    
    // Ensure snake starts in visible area
    const rect = container.getBoundingClientRect();
    const gridWidth = Math.max(10, Math.floor(rect.width / gameRef.current.cellSize));
    const gridHeight = Math.max(10, Math.floor(rect.height / gameRef.current.cellSize));
    
    // Reset snake position if needed
    if (gameRef.current.snake.length === 0 || 
        gameRef.current.snake[0].x < 0 || 
        gameRef.current.snake[0].x >= gridWidth ||
        gameRef.current.snake[0].y < 0 ||
        gameRef.current.snake[0].y >= gridHeight) {
      const newStart = { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2) };
      gameRef.current.snake = [newStart];
      setSnake([newStart]);
    }
    
    const updateGame = () => {
      if (showRickRoll) return;

      const rect = container.getBoundingClientRect();
      const gridWidth = Math.max(10, Math.floor(rect.width / gameRef.current.cellSize));
      const gridHeight = Math.max(10, Math.floor(rect.height / gameRef.current.cellSize));

      // Initialize bug if needed
      if (!gameRef.current.bug) {
        generateBug(gridWidth, gridHeight, gameRef.current.snake);
      }

      const currentSnake = gameRef.current.snake;
      const currentBug = gameRef.current.bug;

      // Update direction
      gameRef.current.direction = { ...gameRef.current.nextDirection };

      // Calculate new head position
      const head = {
        x: currentSnake[currentSnake.length - 1].x + gameRef.current.direction.x,
        y: currentSnake[currentSnake.length - 1].y + gameRef.current.direction.y,
      };

      // Wrap around walls
      if (head.x < 0) head.x = gridWidth - 1;
      if (head.x >= gridWidth) head.x = 0;
      if (head.y < 0) head.y = gridHeight - 1;
      if (head.y >= gridHeight) head.y = 0;

      // Check self collision (skip head)
      const bodyCollision = currentSnake.slice(0, -1).some(
        (segment) => segment.x === head.x && segment.y === head.y
      );

      if (bodyCollision) {
        // Reset snake
        const newStart = { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2) };
        gameRef.current.snake = [newStart];
        gameRef.current.direction = { x: 1, y: 0 };
        gameRef.current.nextDirection = { x: 1, y: 0 };
        gameRef.current.bug = null; // Reset bug
        setSnake([newStart]);
        setBug(null);
        generateBug(gridWidth, gridHeight, [newStart]);
        return;
      }

      // Build new snake
      const newSnake = [...currentSnake, head];

      // Check bug collision
      if (currentBug && head.x === currentBug.x && head.y === currentBug.y) {
        // Eat bug - don't remove tail
        setScore((prev) => {
          const newScore = prev + 1;
          if (newScore > gameRef.current.maxSize) {
            gameRef.current.maxSize = newScore;
            setMaxSize(newScore);
            
            if (newScore >= 50 && !gameRef.current.maxSizeReachedAt) {
              gameRef.current.maxSizeReachedAt = Date.now();
              setMaxSizeReachedAt(Date.now());
            }
          }
          return newScore;
        });
        
        generateBug(gridWidth, gridHeight, newSnake);
      } else {
        // Remove tail
        newSnake.shift();
      }

      gameRef.current.snake = newSnake;
      setSnake([...newSnake]);
    };

    // Start game loop
    intervalRef.current = setInterval(updateGame, 120); // 20% faster (120ms instead of 150ms)

    // Keyboard controls
    const handleKeyPress = (e: KeyboardEvent) => {
      const { direction } = gameRef.current;
      const key = e.key;

      // Prevent reverse direction
      if (key === "ArrowUp" && direction.y === 0) {
        gameRef.current.nextDirection = { x: 0, y: -1 };
      } else if (key === "ArrowDown" && direction.y === 0) {
        gameRef.current.nextDirection = { x: 0, y: 1 };
      } else if (key === "ArrowLeft" && direction.x === 0) {
        gameRef.current.nextDirection = { x: -1, y: 0 };
      } else if (key === "ArrowRight" && direction.x === 0) {
        gameRef.current.nextDirection = { x: 1, y: 0 };
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [showRickRoll, generateBug]);

  // Tongue animation
  useEffect(() => {
    if (showRickRoll) return;
    const tongueInterval = setInterval(() => {
      setTongueOut(true);
      setTimeout(() => setTongueOut(false), 300);
    }, 2000); // Tongue out every 2 seconds
    return () => clearInterval(tongueInterval);
  }, [showRickRoll]);

  // Check for Rick Roll easter egg - starts after 2 minutes from game start (surprise!)
  useEffect(() => {
    if (showRickRoll) return;

    const checkTimer = setInterval(() => {
      const timeSinceStart = Date.now() - gameStartTimeRef.current;
      if (timeSinceStart >= 120000) {
        // 2 minutes = 120000ms
        setShowRickRoll(true);
      }
    }, 1000); // Check every second

    return () => clearInterval(checkTimer);
  }, [showRickRoll]);

  // Fullscreen Rick Roll
  useEffect(() => {
    if (showRickRoll) {
      // Small delay to ensure iframe is rendered
      setTimeout(() => {
        const iframe = document.getElementById("rick-roll-iframe") as HTMLIFrameElement;
        if (iframe) {
          iframe.requestFullscreen?.().catch(() => {
            // Fallback: try with document
            document.documentElement.requestFullscreen?.().catch(() => {
              console.log("Fullscreen not available");
            });
          });
        }
      }, 100);
    }
  }, [showRickRoll]);

  if (showRickRoll) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black">
        <iframe
          id="rick-roll-iframe"
          className="w-full h-full"
          src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&loop=1&playlist=dQw4w9WgXcQ&enablejsapi=1"
          allow="autoplay; fullscreen"
          allowFullScreen
          title="Rick Roll"
        />
        <button
          onClick={() => {
            setShowRickRoll(false);
            if (document.exitFullscreen) {
              document.exitFullscreen();
            }
          }}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded backdrop-blur-sm transition-all"
        >
          ✕ Chiudi
        </button>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 pointer-events-none">
        {/* Snake */}
        {snake.map((segment, index) => {
          const isHead = index === snake.length - 1;
          const prevSegment = index > 0 ? snake[index - 1] : null;
          const progress = snake.length > 1 ? index / (snake.length - 1) : 0;
          
          // Realistic snake dimensions - larger for visibility
          const bodySize = 14;
          const headSize = 24;
          
          const size = isHead ? headSize : bodySize;
          
          // Calculate rotation for smooth movement
          let rotation = 0;
          if (prevSegment) {
            const dx = segment.x - prevSegment.x;
            const dy = segment.y - prevSegment.y;
            if (dx !== 0 || dy !== 0) {
              rotation = Math.atan2(dy, dx) * (180 / Math.PI);
            }
          } else if (isHead && snake.length === 1) {
            // Single segment (just head) - use current direction
            rotation = Math.atan2(gameRef.current.direction.y, gameRef.current.direction.x) * (180 / Math.PI);
          }
          
          // Realistic snake colors - green snake with pattern
          const baseColor = isHead 
            ? '#22c55e' // Brighter green for head
            : progress < 0.3 
              ? '#16a34a' // Darker green near head
              : '#15803d'; // Darkest green for tail
          
          const scaleColor = `rgba(34, 197, 94, ${0.5 + progress * 0.3})`;
          const darkScaleColor = `rgba(21, 128, 61, ${0.7 + progress * 0.2})`;

          return (
            <div
              key={`snake-${index}`}
              className="absolute"
              style={{
                left: `${segment.x * gameRef.current.cellSize}px`,
                top: `${segment.y * gameRef.current.cellSize}px`,
                width: `${size}px`,
                height: `${size}px`,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                zIndex: isHead ? 50 : 40 - Math.floor(progress * 10),
                pointerEvents: 'none',
              }}
            >
              {/* Snake body/head shape */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: isHead
                    ? `radial-gradient(ellipse at 30% 30%, ${baseColor} 0%, ${baseColor} 40%, #16a34a 100%)`
                    : `radial-gradient(ellipse at center, ${baseColor} 0%, ${baseColor} 50%, ${darkScaleColor} 100%)`,
                  borderRadius: isHead 
                    ? '45% 50% 50% 45% / 55% 55% 45% 45%' // Triangular snake head
                    : '50%',
                  border: `1px solid ${darkScaleColor}`,
                  boxShadow: isHead
                    ? `inset 0 0 8px rgba(34, 197, 94, 0.4), 0 2px 6px rgba(0,0,0,0.4), 0 0 12px rgba(34, 197, 94, 0.3)`
                    : `inset 0 0 4px rgba(34, 197, 94, 0.2), 0 1px 3px rgba(0,0,0,0.3)`,
                  position: 'relative',
                }}
              >
                {/* Scale pattern on body */}
                {!isHead && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: '0',
                      backgroundImage: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 3px,
                        ${scaleColor} 3px,
                        ${scaleColor} 4px
                      ),
                      repeating-linear-gradient(
                        -45deg,
                        transparent,
                        transparent 3px,
                        ${scaleColor} 3px,
                        ${scaleColor} 4px
                      )`,
                      borderRadius: '50%',
                      opacity: 0.6,
                    }}
                  />
                )}
                
                {/* Head details */}
                {isHead && (
                  <>
                    {/* Eyes */}
                    <div
                      className="absolute rounded-full bg-yellow-400"
                      style={{
                        width: '5px',
                        height: '5px',
                        top: '28%',
                        left: '32%',
                        boxShadow: 'inset 0 0 2px rgba(0,0,0,0.5), 0 0 3px rgba(251, 191, 36, 0.8)',
                        border: '1px solid rgba(0,0,0,0.3)',
                      }}
                    />
                    <div
                      className="absolute rounded-full bg-yellow-400"
                      style={{
                        width: '5px',
                        height: '5px',
                        top: '28%',
                        right: '32%',
                        boxShadow: 'inset 0 0 2px rgba(0,0,0,0.5), 0 0 3px rgba(251, 191, 36, 0.8)',
                        border: '1px solid rgba(0,0,0,0.3)',
                      }}
                    />
                    
                    {/* Nostrils */}
                    <div
                      className="absolute rounded-full bg-black"
                      style={{
                        width: '2px',
                        height: '2px',
                        top: '45%',
                        left: '40%',
                        opacity: 0.6,
                      }}
                    />
                    <div
                      className="absolute rounded-full bg-black"
                      style={{
                        width: '2px',
                        height: '2px',
                        top: '45%',
                        right: '40%',
                        opacity: 0.6,
                      }}
                    />
                    
                    {/* Tongue */}
                    {tongueOut && (
                      <>
                        <div
                          className="absolute bg-red-500"
                          style={{
                            width: '2px',
                            height: '8px',
                            top: '60%',
                            left: '50%',
                            transform: 'translateX(-50%) rotate(-10deg)',
                            borderRadius: '0 0 50% 50%',
                            boxShadow: '0 0 2px rgba(239, 68, 68, 0.8)',
                          }}
                        />
                        <div
                          className="absolute bg-red-500"
                          style={{
                            width: '2px',
                            height: '8px',
                            top: '60%',
                            left: '50%',
                            transform: 'translateX(-50%) rotate(10deg)',
                            borderRadius: '0 0 50% 50%',
                            boxShadow: '0 0 2px rgba(239, 68, 68, 0.8)',
                          }}
                        />
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Bug - 20% larger */}
        {bug && (
          <div
            className="absolute animate-pulse"
            style={{
              left: `${bug.x * gameRef.current.cellSize}px`,
              top: `${bug.y * gameRef.current.cellSize}px`,
              transform: `translate(-50%, -50%)`,
              fontSize: "24px", // 20% larger (was 20px)
              zIndex: 60,
              pointerEvents: 'none',
            }}
          >
            🐛
          </div>
        )}
      </div>

      {/* Score Display */}
      <div className="absolute top-4 left-4 z-50 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded font-mono text-sm">
        <div>Score: <span className="text-green-400">{score}</span></div>
        <div>Max Size: <span className="text-yellow-400">{maxSize}</span></div>
        <div className="text-xs text-white/40 mt-2">Use arrow keys to play</div>
      </div>
    </>
  );
}

const ERROR_MESSAGES = [
  "404: Page Not Found",
  "404: Null Reference Exception",
  "404: Undefined Variable",
  "404: Route Not Found",
  "404: File Not Found",
  "404: Method Not Allowed",
  "404: Stack Overflow",
  "404: Memory Leak Detected",
  "404: Cache Miss",
  "404: DNS Resolution Failed",
];

const NERD_JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
  "There are only 10 types of people: those who understand binary and those who don't. 💻",
  "I would tell you a joke about UDP, but you might not get it. 📡",
  "Why don't programmers like nature? It has too many bugs. 🐞",
  "How many programmers does it take to change a light bulb? None, that's a hardware problem. 💡",
  "Why did the programmer quit his job? He didn't get arrays! 📊",
  "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?' 🗄️",
  "Why was the JavaScript developer sad? Because he didn't know how to `null` his feelings. 😢",
  "Why do Java developers wear glasses? Because they can't C#! 👓",
  "Why do Python programmers prefer dark mode? Because light mode is too bright! 🐍",
  "What's a programmer's favorite hangout place? Foo Bar! 🍺",
  "Why do programmers always mix up Halloween and Christmas? Because Oct 31 == Dec 25! 🎃",
  "How do you tell an introverted programmer from an extroverted programmer? Extrovert looks at YOUR shoes when talking. 👞",
  "Why do Python programmers prefer snakes? Because they're already in their natural habitat! 🐍",
  "What's the object-oriented way to become wealthy? Inheritance! 💰",
  "Why did the programmer get stuck in the shower? They read the instructions: 'Lather, Rinse, Repeat' 🔄",
  "How do you comfort a JavaScript bug? You console it! 🐛",
  "Why don't programmers like to go outside? The sun causes glare on their screens! ☀️",
  "What do you call a programmer from Finland? Nerdic! 🇫🇮",
  "Why did the developer go broke? Because they used up all their cache! 💸",
  "Why do programmers hate nature? It has too many bugs AND no documentation! 📚",
  "What's a programmer's favorite snack? Code-ies! 🍪",
  "Why did the programmer refuse to play hide and seek? Good luck hiding when you're always found in the console! 🔍",
  "What's a programmer's favorite drink? Java! ☕",
  "Why did the developer break up with their keyboard? There was no connection! ⌨️",
  "How do you know if a programmer is an extrovert? They look at YOUR shoes when talking! 👟",
  "Why do developers prefer dark chocolate? Because it has fewer bugs! 🍫",
  "What's a programmer's favorite instrument? The keyboard! 🎹",
  "Why don't programmers like to exercise? They prefer to loop instead! 🔄",
  "Why did the programmer get fired? They couldn't C#! 💼",
  "What do you call a programmer who works at night? A night owl... or just a regular programmer! 🦉",
];

const CODE_SNIPPETS = [
  "if (page.exists()) { return page; } else { return 404; }",
  "function findPage() { throw new NotFoundException(); }",
  "const page = await fetch('/api/page').catch(() => null);",
  "SELECT * FROM pages WHERE url = ? LIMIT 0;",
  "HTTP/1.1 404 Not Found",
  "router.push('/404'); // You are here",
  "return <NotFound />;",
];

export default function NotFound() {
  const [errorMessage, setErrorMessage] = useState(ERROR_MESSAGES[0]);
  const [joke, setJoke] = useState(NERD_JOKES[0]);
  const [codeSnippet, setCodeSnippet] = useState(CODE_SNIPPETS[0]);
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    // Cambia messaggio ogni 3 secondi
    const messageInterval = setInterval(() => {
      setErrorMessage(ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)]);
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 500);
    }, 3000);

    // Cambia joke ogni 5 secondi
    const jokeInterval = setInterval(() => {
      setJoke(NERD_JOKES[Math.floor(Math.random() * NERD_JOKES.length)]);
    }, 5000);

    // Cambia codice ogni 4 secondi
    const codeInterval = setInterval(() => {
      setCodeSnippet(CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)]);
    }, 4000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(jokeInterval);
      clearInterval(codeInterval);
    };
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0066CC] via-[#0052A3] to-[#003D7A] p-6">
      {/* Snake Game */}
      <SnakeGame />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating code brackets */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-white/10 font-mono text-6xl animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
            }}
          >
            {["{", "}", "[", "]", "(", ")", "<", ">", "/", "*"][Math.floor(Math.random() * 10)]}
          </div>
        ))}

        {/* Animated grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] animate-grid-pulse" />

        {/* Glitch effect overlay */}
        {glitchActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-blue-500/20 animate-glitch" />
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl w-full text-center">
        {/* Error code with glitch effect */}
        <div className="mb-8">
          <h1
            className={`text-9xl font-bold text-white mb-4 font-mono transition-all duration-300 ${
              glitchActive ? "animate-glitch-text" : ""
            }`}
            style={{
              textShadow: "0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(0,102,204,0.5)",
            }}
          >
            404
          </h1>
          <h2
            className={`text-3xl font-semibold text-white/90 mb-2 font-mono transition-all ${
              glitchActive ? "animate-glitch-text" : ""
            }`}
          >
            {errorMessage}
          </h2>
        </div>

        {/* Code snippet card */}
        <div className="mb-8 rounded-lg bg-black/40 backdrop-blur-sm border border-white/20 p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-white/60 text-sm font-mono ml-2">terminal.tsx</span>
          </div>
          <pre className="text-left text-green-400 font-mono text-sm overflow-x-auto">
            <code className="animate-typewriter">{codeSnippet}</code>
          </pre>
        </div>

        {/* Joke card */}
        <div className="mb-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-6 shadow-xl">
          <p className="text-white text-lg italic animate-fade-in">{joke}</p>
        </div>

        {/* Console log */}
        <div className="mb-8 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 p-4 font-mono text-left text-sm text-white/80">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-400">$</span>
            <span className="animate-blink">_</span>
          </div>
          <div className="text-red-400">console.error("Page not found: {window.location.pathname}");</div>
          <div className="text-yellow-400 mt-1">// Maybe try checking your routes? 🤔</div>
          <div className="text-green-400 mt-1">// Or just go back to safety ⬇️</div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/">
            <Button
              variant="primary"
              className="bg-white text-[#0066CC] hover:bg-white/90 font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              🏠 Torna alla Home
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-semibold px-8 py-6 text-lg backdrop-blur-sm transition-all hover:scale-105"
          >
            ⬅️ Torna Indietro
          </Button>
        </div>

        {/* Debug info */}
        <div className="mt-12 text-white/60 text-sm font-mono">
          <div>Status: <span className="text-red-400">ERROR</span></div>
          <div>Code: <span className="text-yellow-400">404</span></div>
          <div>Message: <span className="text-green-400">NOT_FOUND</span></div>
          <div className="mt-2 text-xs">
            Digimax Budget Hub v1.0 •{" "}
            <span className="text-white/40">Made with ❤️ and too much ☕</span>
          </div>
        </div>
      </div>

    </div>
  );
}

