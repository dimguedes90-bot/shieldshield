
import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, XMarkIcon, ChatBubbleOvalLeftEllipsisIcon, CpuChipIcon, BoltIcon, RocketLaunchIcon } from '@heroicons/react/24/solid';
import { getChatResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'flash' | 'pro' | 'lite'>('flash');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), text: input, sender: 'user', mode };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const geminiResponseText = await getChatResponse(input, mode);
    
    const geminiMessage: ChatMessage = { id: (Date.now() + 1).toString(), text: geminiResponseText, sender: 'gemini', mode };
    setMessages(prev => [...prev, geminiMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };
  
  const ModeButton = ({ btnMode, label, icon }: {btnMode: 'flash' | 'pro' | 'lite', label: string, icon: React.ElementType}) => {
    const Icon = icon;
    return (
        <button
            onClick={() => setMode(btnMode)}
            className={`flex-1 flex items-center justify-center p-2 text-xs rounded-md transition-all ${mode === btnMode ? 'bg-teal text-navy font-semibold' : 'bg-navy-light text-gray-300 hover:bg-navy'}`}
            title={`Switch to ${label} mode`}
        >
            <Icon className="h-4 w-4 mr-1.5" />
            {label}
        </button>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-teal text-navy p-4 rounded-full shadow-lg hover:bg-opacity-90 transition-all z-50"
        aria-label="Open Chat"
      >
        <ChatBubbleOvalLeftEllipsisIcon className="h-8 w-8" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[90vw] max-w-sm h-[70vh] max-h-[600px] bg-navy-dark rounded-xl shadow-2xl flex flex-col z-50">
      <div className="flex justify-between items-center p-4 border-b border-navy-light">
        <h3 className="text-lg font-bold text-teal">Gemini Assistant</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-xl ${msg.sender === 'user' ? 'bg-teal text-navy' : 'bg-navy-light text-white'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="max-w-[80%] p-3 rounded-xl bg-navy-light text-white">
                  <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-teal rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-teal rounded-full animate-pulse delay-200"></div>
                      <div className="w-2 h-2 bg-teal rounded-full animate-pulse delay-400"></div>
                  </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="p-4 border-t border-navy-light space-y-2">
        <div className="flex gap-2 p-1 bg-navy-dark rounded-lg">
           <ModeButton btnMode="lite" label="Low-Latency" icon={BoltIcon} />
           <ModeButton btnMode="flash" label="Balanced" icon={RocketLaunchIcon} />
           <ModeButton btnMode="pro" label="Thinking Mode" icon={CpuChipIcon} />
        </div>
        <div className="flex items-center bg-navy-light rounded-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent p-3 text-white focus:outline-none"
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading} className="p-3 text-teal disabled:text-gray-500">
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
