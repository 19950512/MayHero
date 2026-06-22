'use client'

import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { CharacterCreation } from './components/CharacterCreation'
import { GameUI } from './components/GameUI'

export default function Home() {
  const { hero, gameStarted, resetGame } = useGameStore()

  useEffect(() => {
    // Recover from stale persisted sessions that can lead to a blank screen.
    if (gameStarted && !hero) {
      resetGame()
    }
  }, [gameStarted, hero, resetGame])

  return (
    <main className="h-screen overflow-hidden">
      {gameStarted && hero ? <GameUI /> : <CharacterCreation />}
    </main>
  )
}
