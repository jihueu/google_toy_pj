import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameStatus } from './types';

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.START);
  const [score, setScore] = useState<number>(0);

  const handleRestart = () => {
    setScore(0);
    setGameStatus(GameStatus.PLAYING);
    // Note: The logic to actually reset positions is inside GameCanvas effect listening to status change
    // or we can force a remount if needed, but the current prop-driven approach handles it.
    
    // To ensure a clean state reset, we trigger a keydown event or rely on the canvas effect
    // We will trigger a fake space event to let the canvas hook handle the reset logic cleanly
    const event = new KeyboardEvent('keydown', { code: 'Space' });
    window.dispatchEvent(event);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900 overflow-hidden relative">
      
      {/* Title */}
      <h1 className="text-4xl md:text-6xl text-white mb-4 drop-shadow-lg tracking-wider text-center">
        Santa's Winter Jump
      </h1>

      <div className="relative group">
        {/* The Game Canvas */}
        <GameCanvas 
          gameStatus={gameStatus} 
          setGameStatus={setGameStatus}
          score={score}
          setScore={setScore}
        />

        {/* Score Overlay (Top Left) */}
        <div className="absolute top-4 left-4 bg-white/80 border-2 border-blue-400 text-blue-900 px-4 py-2 rounded-xl text-2xl shadow-lg pointer-events-none select-none">
          Score: {score}
        </div>

        {/* Start Screen Overlay */}
        {gameStatus === GameStatus.START && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-lg backdrop-blur-sm z-10">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center border-4 border-red-500 animate-bounce-slow">
              <p className="text-2xl text-slate-700 mb-4">Ready to deliver gifts?</p>
              <p className="text-lg text-slate-500 mb-6">Avoid birds and snowmen!</p>
              <div className="text-xl bg-red-500 text-white px-6 py-3 rounded-full animate-pulse">
                Press Space or Tap to Start
              </div>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameStatus === GameStatus.GAME_OVER && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg backdrop-blur-sm z-20">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center border-4 border-red-500 max-w-sm w-full mx-4">
              <h2 className="text-4xl text-red-600 mb-2">Game Over!</h2>
              <p className="text-xl text-slate-600 mb-6">Santa hit an obstacle.</p>
              
              <div className="bg-blue-100 p-4 rounded-xl mb-6">
                <p className="text-sm text-blue-600 uppercase tracking-bold">Final Score</p>
                <p className="text-5xl text-blue-800">{score}</p>
              </div>

              <button 
                onClick={handleRestart}
                className="w-full bg-green-500 hover:bg-green-600 text-white text-xl py-4 rounded-xl transition-transform hover:scale-105 active:scale-95 shadow-lg border-b-4 border-green-700"
              >
                Restart Game
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-slate-400 text-sm text-center">
        <p>Controls: Press <strong>Spacebar</strong> or <strong>Click/Tap</strong> to jump.</p>
        <p>Tip: Stay low for clouds and birds!</p>
      </div>
    </div>
  );
};

export default App;