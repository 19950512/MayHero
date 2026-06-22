'use client'

import { useGameStore } from './store/gameStore'
import { CharacterCreation } from './components/CharacterCreation'
import { GameUI } from './components/GameUI'

export default function Home() {
  const { gameStarted } = useGameStore()

  return (
    <main className="h-screen overflow-hidden">
      {gameStarted ? <GameUI /> : <CharacterCreation />}
    </main>
  )
}
