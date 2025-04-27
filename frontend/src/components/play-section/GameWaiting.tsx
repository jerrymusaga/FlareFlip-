export function GameWaiting() {
    return (
      <div className="text-center">
        <div className="text-3xl mb-4">Waiting for players...</div>
        <div className="flex gap-2 justify-center">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    );
  }