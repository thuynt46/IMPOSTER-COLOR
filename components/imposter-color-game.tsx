"use client"

import { useState, useEffect } from "react"
import { ArrowRight, Home, Info, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type GameState = "intro" | "start" | "playing" | "success" | "gameover"

interface Level {
  gridSize: number
  colorDifference: number
  timeLimit: number
  points: number
}

export default function ImposterColorGame() {
  const [gameState, setGameState] = useState<GameState>("intro")
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [grid, setGrid] = useState<{ color: string; isImposter: boolean }[]>([])
  const [imposterPosition, setImposterPosition] = useState(-1)
  const [showAbout, setShowAbout] = useState(true)
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(0)
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)
  const [wrongSelection, setWrongSelection] = useState<number | null>(null)

  // Define levels
  const levels: Level[] = [
    { gridSize: 2, colorDifference: 50, timeLimit: 10, points: 10 },
    { gridSize: 3, colorDifference: 40, timeLimit: 10, points: 20 },
    { gridSize: 4, colorDifference: 35, timeLimit: 15, points: 30 },
    { gridSize: 5, colorDifference: 30, timeLimit: 15, points: 40 },
    { gridSize: 6, colorDifference: 25, timeLimit: 20, points: 50 },
    { gridSize: 6, colorDifference: 20, timeLimit: 20, points: 60 },
    { gridSize: 7, colorDifference: 15, timeLimit: 25, points: 70 },
    { gridSize: 8, colorDifference: 12, timeLimit: 25, points: 80 },
    { gridSize: 9, colorDifference: 10, timeLimit: 30, points: 90 },
    { gridSize: 10, colorDifference: 8, timeLimit: 30, points: 100 },
  ]

  // Load high score from localStorage on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem("imposterColorHighScore")
    if (savedHighScore) {
      setHighScore(Number.parseInt(savedHighScore))
    }
  }, [])

  // Save high score to localStorage when it changes
  useEffect(() => {
    if (highScore > 0) {
      localStorage.setItem("imposterColorHighScore", highScore.toString())
    }
  }, [highScore])

  // Timer logic
  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)

      return () => clearInterval(interval)
    } else if (gameState === "playing" && timeLeft === 0) {
      setGameState("gameover")
      if (score > highScore) {
        setHighScore(score)
      }
    }
  }, [gameState, timeLeft, score, highScore])

  // Generate a random color in RGB format
  const generateRandomColor = () => {
    const r = Math.floor(Math.random() * 156) + 50 // 50-205
    const g = Math.floor(Math.random() * 156) + 50 // 50-205
    const b = Math.floor(Math.random() * 156) + 50 // 50-205
    return { r, g, b }
  }

  // Generate a slightly different color based on the base color
  const generateImposterColor = (baseColor: { r: number; g: number; b: number }, difference: number) => {
    // Randomly choose which component(s) to modify
    const component = Math.floor(Math.random() * 3) // 0: r, 1: g, 2: b

    let { r, g, b } = baseColor

    // Add or subtract the difference
    const addOrSubtract = Math.random() > 0.5 ? 1 : -1

    if (component === 0) {
      r = Math.max(0, Math.min(255, r + addOrSubtract * difference))
    } else if (component === 1) {
      g = Math.max(0, Math.min(255, g + addOrSubtract * difference))
    } else {
      b = Math.max(0, Math.min(255, b + addOrSubtract * difference))
    }

    return { r, g, b }
  }

  // Initialize a new level
  const initializeLevel = (nextLevel?: number) => {
    const level_ = nextLevel || level
    const currentLevel = levels[Math.min(level_ - 1, levels.length - 1)]
    const gridSize = currentLevel.gridSize
    const colorDifference = currentLevel.colorDifference
    const totalTiles = gridSize * gridSize

    // Generate base color
    const baseColor = generateRandomColor()
    const baseColorStr = `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`

    // Generate imposter color
    const imposterColor = generateImposterColor(baseColor, colorDifference)
    const imposterColorStr = `rgb(${imposterColor.r}, ${imposterColor.g}, ${imposterColor.b})`

    // Randomly select imposter position
    const imposterPos = Math.floor(Math.random() * totalTiles)
    setImposterPosition(imposterPos)

    const newGrid = Array(totalTiles)
      .fill(null)
      .map((_, index) => ({
        color: index === imposterPos ? imposterColorStr : baseColorStr,
        isImposter: index === imposterPos,
      }))

    setGrid(newGrid)
    setTimeLeft(currentLevel.timeLimit)
    setGameState("playing")
    setWrongSelection(null)
  }

  // Start a new game
  const startGame = () => {
    setLevel(1)
    setScore(0)
    setShowAbout(false)
    setShowHowToPlay(false)
    setWrongSelection(null)
    initializeLevel(1)
  }

  // Handle tile click
  const handleTileClick = (index: number) => {
    if (gameState !== "playing") return

    if (index === imposterPosition) {
      // Correct tile clicked
      const currentLevel = levels[Math.min(level - 1, levels.length - 1)]
      const pointsEarned = currentLevel.points + Math.floor(timeLeft * 0.5) // Bonus points for speed
      setEarnedPoints(pointsEarned)
      setScore((prev) => prev + pointsEarned)
      setGameState("success")

      if (timer) {
        clearTimeout(timer)
      }
    } else {
      // Wrong tile clicked
      setWrongSelection(index)

      // Clear the wrong selection after a short delay
      setTimeout(() => {
        setWrongSelection(null)
      }, 1000)
    }
  }

  // Go to next level
  const nextLevel = () => {
    const nextLevel = level + 1;
    setLevel((prev) => prev + 1)
    setEarnedPoints(0)
    initializeLevel(nextLevel)
  }

  // Return to menu
  const goToMenu = () => {
    setGameState("start")
    setShowAbout(true)
  }

  // Restart game after game over
  const restartGame = () => {
    startGame()
  }

  // Toggle how to play instructions
  const toggleHowToPlay = () => {
    setShowHowToPlay(!showHowToPlay)
    setShowAbout(false)
  }

  // Calculate grid template columns based on current level
  const getGridTemplateColumns = () => {
    const currentLevel = levels[Math.min(level - 1, levels.length - 1)]
    return `repeat(${currentLevel.gridSize}, minmax(0, 1fr))`
  }

  // Calculate difficulty percentage
  const getDifficultyPercentage = () => {
    return Math.min(Math.floor((level / levels.length) * 100), 100)
  }

  // Go from intro to start menu
  const goToStartMenu = () => {
    setGameState("start")
    setShowAbout(true)
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4">
      {/* Logo and Title */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex gap-2 mb-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "w-8 h-8 rounded-md transition-all duration-300",
                i === 0 || i === 2 ? "bg-purple-600" : "bg-purple-400",
              )}
            />
          ))}
        </div>
        <h1 className="text-2xl font-bold tracking-wider text-white">IMPOSTER COLOR</h1>
        <p className="text-sm text-purple-300 tracking-wider">TEST YOUR PERCEPTION</p>
      </div>

      {/* Intro Screen */}
      {gameState === "intro" && (
        <div className="w-full">
          <div className="bg-slate-800/80 rounded-lg p-6 mb-6 border border-slate-700 text-center">
            <div className="flex justify-center mb-6">
              <div className="grid grid-cols-3 gap-2">
                {Array(9)
                  .fill(null)
                  .map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-8 h-8 rounded-md transition-all duration-300",
                        i === 4 ? "bg-purple-400" : "bg-purple-600",
                      )}
                    />
                  ))}
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4 text-purple-300">Welcome to Imposter Color!</h2>

            <p className="text-sm text-slate-300 mb-6">
              Train your visual perception by finding the one tile with a slightly different color. As you progress, the
              challenge increases with more similar colors and larger grids.
            </p>

            <div className="space-y-3">
              <Button
                onClick={startGame}
                className="bg-purple-600 hover:bg-purple-700 text-white w-full py-6 rounded-md transition-all duration-300"
              >
                Play Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                onClick={goToStartMenu}
                variant="outline"
                className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 w-full py-6 rounded-md transition-all duration-300"
              >
                Main Menu <Home className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {gameState === "start" && (
        <div className="w-full">
          {showAbout && (
            <div className="bg-slate-800/80 rounded-lg p-4 mb-6 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-slate-400" />
                <h2 className="text-sm font-medium">About the Game</h2>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                Imposter Color tests your visual perception by challenging you to identify the one tile with a slightly
                different color. As you progress, the colors become increasingly similar, the grid grows larger, and the
                viewing time shortens. Train your eye to detect subtle color differences and improve your visual acuity!
              </p>
            </div>
          )}

          {showHowToPlay && (
            <div className="bg-slate-800/80 rounded-lg p-4 mb-6 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-slate-400" />
                <h2 className="text-sm font-medium">How to Play</h2>
              </div>
              <ul className="text-sm text-slate-300 list-disc pl-5 space-y-2">
                <li>Find and tap the tile with a slightly different color</li>
                <li>Complete each level before the timer runs out</li>
                <li>Each level gets progressively harder</li>
                <li>Earn bonus points for finding the imposter quickly</li>
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={startGame}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full py-6 rounded-md transition-all duration-300"
            >
              Start Game <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              onClick={() => setGameState("intro")}
              variant="outline"
              className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 w-full py-6 rounded-md transition-all duration-300"
            >
              <Info className="mr-2 h-4 w-4" /> How to Play
            </Button>
          </div>

          {highScore > 0 && (
            <div className="flex justify-center items-center mt-6 text-sm text-purple-300">
              <Trophy className="h-4 w-4 mr-2" /> High Score: {highScore}
            </div>
          )}
        </div>
      )}

      {/* Game Screen */}
      {gameState === "playing" && (
        <div className="w-full">
          <div className="flex justify-between items-center mb-4 bg-slate-800/80 rounded-lg p-3">
            <div>
              <div className="text-sm font-medium">Level {level}</div>
              <div className="text-xs text-slate-400">Difficulty: {getDifficultyPercentage()}/100</div>
            </div>
            <div className="text-right">
              <div className="text-sm">{timeLeft}s</div>
              <div className="text-xs text-slate-400">Score: {score}</div>
            </div>
          </div>

          <div
            className="grid gap-2 mb-4 w-full aspect-square"
            style={{ gridTemplateColumns: getGridTemplateColumns() }}
          >
            {grid.map((tile, index) => (
              <button
                key={index}
                className={cn(
                  "rounded-md transition-all duration-300 transform hover:scale-95 active:scale-90",
                  wrongSelection === index ? "ring-2 ring-red-500 animate-shake" : "",
                )}
                style={{ backgroundColor: tile.color }}
                onClick={() => handleTileClick(index)}
                aria-label={tile.isImposter ? "Imposter tile" : "Regular tile"}
              />
            ))}
          </div>
        </div>
      )}

      {/* Success Screen */}
      {gameState === "success" && (
        <div className="w-full">
          <div className="flex justify-between items-center mb-4 bg-slate-800/80 rounded-lg p-3">
            <div>
              <div className="text-sm font-medium">Level {level}</div>
              <div className="text-xs text-slate-400">Difficulty: {getDifficultyPercentage()}/100</div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-xs text-purple-300">
                <Trophy className="h-3 w-3 mr-1" /> High Score: {Math.max(score, highScore)}
              </div>
              <div className="text-xs">Score: {score}</div>
            </div>
          </div>

          <div className="text-center mb-4 text-green-400 font-medium">You found the imposter color!</div>

          <div className="flex gap-3 mb-6">
            <Button
              onClick={nextLevel}
              className="bg-purple-600 hover:bg-purple-700 text-white flex-1 py-5 rounded-md transition-all duration-300"
            >
              → Next Level
            </Button>

            <Button
              onClick={goToMenu}
              variant="outline"
              className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 py-5 rounded-md transition-all duration-300"
            >
              <Home className="h-4 w-4" /> Menu
            </Button>
          </div>

          <div
            className="grid gap-2 mb-4 w-full aspect-square"
            style={{ gridTemplateColumns: getGridTemplateColumns() }}
          >
            {grid.map((tile, index) => (
              <div
                key={index}
                className={cn("rounded-md transition-all duration-300", tile.isImposter ? "ring-2 ring-green-400" : "")}
                style={{ backgroundColor: tile.color }}
              />
            ))}
          </div>

          {earnedPoints > 0 && (
            <div className="text-center text-green-400 font-medium animate-pulse">+{earnedPoints} points</div>
          )}
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === "gameover" && (
        <div className="w-full">
          <div className="bg-slate-800/80 rounded-lg p-6 mb-6 border border-slate-700 text-center">
            <h2 className="text-xl font-bold mb-2 text-red-400">Game Over!</h2>
            <p className="text-slate-300 mb-4">You ran out of time.</p>

            <div className="flex flex-col gap-2 mb-4">
              <div className="flex justify-between">
                <span>Final Score:</span>
                <span className="font-bold">{score}</span>
              </div>
              <div className="flex justify-between text-purple-300">
                <span>High Score:</span>
                <span className="font-bold">{highScore}</span>
              </div>
              <div className="flex justify-between">
                <span>Level Reached:</span>
                <span>{level}</span>
              </div>
            </div>

            <Button
              onClick={restartGame}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full py-5 mt-2 rounded-md transition-all duration-300"
            >
              Play Again
            </Button>

            <Button
              onClick={goToMenu}
              variant="outline"
              className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 w-full py-5 mt-3 rounded-md transition-all duration-300"
            >
              <Home className="mr-2 h-4 w-4" /> Back to Menu
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

