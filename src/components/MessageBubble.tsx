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
          ? 'bg-brody-user border-brody-border text-brody-muted'
          : 'bg-brody-palm border-brody-border'
        }`}
      >
        {isUser ? '✦' : '🌊'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[76%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <span className="text-brody-muted text-[10px] uppercase tracking-widest font-quicksand px-1">
          {isUser ? 'You' : 'Brody'}
        </span>
        <div className={`relative rounded-smooth px-4 py-3 text-sm leading-relaxed font-quicksand
          whitespace-pre-wrap border
          ${isUser
            ? 'bg-brody-user border-brody-border text-brody-sand rounded-tr-md'
            : 'bg-brody-assistant border-brody-border text-brody-sand rounded-tl-md'
          }`}
        >
          {/* Colored left/right accent bar */}
          <span className={`absolute top-3 bottom-3 w-0.5 rounded-full
            ${isUser
              ? 'right-0 translate-x-px bg-brody-foam opacity-40'
              : 'left-0 -translate-x-px bg-brody-foam opacity-60'
            }`}
          />
          {message.content}
        </div>
      </div>
    </div>
  );
}
