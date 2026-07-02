'use client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`fade-up flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>

      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base
        border ${isUser
          ? 'bg-dude-user border-dude-border text-dude-muted'
          : 'bg-dude-green border-dude-border'
        }`}
      >
        {isUser ? '✦' : '🎳'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[76%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <span className="text-dude-muted text-[10px] uppercase tracking-widest font-playfair px-1">
          {isUser ? 'You' : 'Lebowski'}
        </span>
        <div className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed font-playfair
          whitespace-pre-wrap border
          ${isUser
            ? 'bg-dude-user border-dude-border text-dude-cream rounded-tr-sm'
            : 'bg-dude-assistant border-dude-border text-dude-cream rounded-tl-sm'
          }`}
        >
          {/* Colored left/right accent bar */}
          <span className={`absolute top-3 bottom-3 w-0.5 rounded-full
            ${isUser
              ? 'right-0 translate-x-px bg-dude-gold opacity-40'
              : 'left-0 -translate-x-px bg-dude-green opacity-60'
            }`}
          />
          {message.content}
        </div>
      </div>
    </div>
  );
}
