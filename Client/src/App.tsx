import { useEffect, useRef, useState } from 'react';
import { Trash2, Users, ArrowLeft, LogIn, Paintbrush, Download } from 'lucide-react';

function App() {
  // --- States ---
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [status, setStatus] = useState('Connecting...');
  const [color, setColor] = useState('#000000'); // FIXED: Default to Black
  const [brushSize] = useState(5);
  const [userCount, setUserCount] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);

  // --- Refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const lastPoint = useRef<{ x: number, y: number } | null>(null);

  // --- WebSocket Setup ---
  useEffect(() => {
    if (!joined || !roomId) return;

    const socket = new WebSocket('ws://localhost:8080');
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus('Connected');
      socket.send(JSON.stringify({ type: 'JOIN_ROOM', roomId }));
    };

    socket.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.type === 'SYNC_EVENTS') {
        drawHistory(data.events);
      } else if (data.type === 'EVENT') {
        const { x1, y1, x2, y2, color: remoteColor, size } = data.event;
        drawLine(x1, y1, x2, y2, remoteColor, size);
      } else if (data.type === 'CLEAR_CANVAS') {
        clearLocalCanvas();
      } else if (data.type === 'USER_COUNT') {
        setUserCount(data.count);
      }
    };

    return () => socket.close();
  }, [joined, roomId]);

  // --- Drawing Logic ---
  const drawLine = (x1: number, y1: number, x2: number, y2: number, drawColor: string, size: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  };

  const drawHistory = (events: any[]) => {
    clearLocalCanvas();
    events.forEach(e => drawLine(e.x1, e.y1, e.x2, e.y2, e.color, e.size));
  };

  const clearLocalCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // --- Mouse Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    lastPoint.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !lastPoint.current) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Draw locally
    drawLine(lastPoint.current.x, lastPoint.current.y, x, y, color, brushSize);

    // Broadcast
    socketRef.current?.send(JSON.stringify({
      type: 'EVENT',
      event: { 
        x1: lastPoint.current.x, 
        y1: lastPoint.current.y, 
        x2: x, 
        y2: y, 
        color, 
        size: brushSize 
      }
    }));

    lastPoint.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const broadcastClear = () => {
    if (window.confirm("Clear board for everyone?")) {
      socketRef.current?.send(JSON.stringify({ type: 'CLEAR_CANVAS' }));
      clearLocalCanvas();
    }
  };

  // --- Login Screen (Previous Styling) ---
  if (!joined) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>

        <div className="z-10 text-center space-y-8 max-w-lg px-6">
          <div className="space-y-2">
            <div className="flex justify-center mb-4" >
              <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/40">
                <Paintbrush className="text-white" size={40} />
              </div>
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter">CollabBoard</h1>
            <p className="text-slate-400 text-lg">Real-time collaborative sketching.</p>
          </div>

          <div className="bg-slate-900/50 p-1 border border-slate-800 rounded-3xl backdrop-blur-xl w-90 ">
            <div className="p-6 space-y-4">
              <input 
                type="text" 
                placeholder="Enter a room name..." 
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && roomId && setJoined(true)}
              />
              <button 
                onClick={() => roomId && setJoined(true)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-600/20 text-lg"
              >
                <LogIn size={22} /> Enter Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Interface (Previous Styling) ---
  return (
    <div className="h-screen w-screen bg-slate-900 text-white flex flex-col overflow-hidden select-none relative">
      <div className="bg-slate-800/90 backdrop-blur-md p-4 border-b border-slate-700 flex justify-between items-center px-8 z-20">
        <div className="flex items-center gap-6">
          <button onClick={() => setJoined(false)} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-xl text-white tracking-tight">{roomId}</h2>
              <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Live</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Users size={12} />
              <span className="text-xs font-medium">{userCount} Active Now</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-2.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-700">
            {/* COLOR PALETTE: Added #000000 for visibility */}
            {['#000000', '#3b82f6', '#ef4444', '#22c55e', '#ffffff'].map((c) => (
              <button 
                key={c} onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            onClick={() => {
              const canvas = canvasRef.current;
              if (canvas) {
                const link = document.createElement('a');
                link.download = 'board.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
              }
            }}
          >
            <Download size={18} />
          </button>
          <button onClick={broadcastClear} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold border border-red-500/20">
            <Trash2 size={18} />
            <span className="hidden xl:inline text-sm">Clear Board</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-950 flex items-center justify-center p-6 relative">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          width={window.innerWidth - 60}
          height={window.innerHeight - 140}
          style={{ cursor: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><line x1="16" y1="8" x2="16" y2="24" stroke="black" stroke-width="2.5"/><line x1="8" y1="16" x2="24" y2="16" stroke="black" stroke-width="2.5"/></svg>') 16 16, crosshair` }}
          className="bg-white rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.6)] cursor-crosshair max-w-full max-h-full"
        />
      </div>
    </div>
  );
}

export default App;

