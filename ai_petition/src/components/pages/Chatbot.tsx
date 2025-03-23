/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom';
import { User } from '@/lib/types';
import axios from 'axios';
import Navbar from '../ui/AppNavbar';

// Define message type
interface Message {
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    html?: string; // Add HTML version of the message
}

const ChatbotPage: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);

    // Initialize the Gemini API (in a real app, you would use environment variables)
    const initializeGeminiAPI = async () => {
        const apiKey = import.meta.env.VITE_PUBLIC_GEMINI_API_KEY || 'YOUR_API_KEY';
        const genAI = new GoogleGenerativeAI(apiKey);

        return genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 1,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
                responseMimeType: "text/plain",
            }
        });
    };

    // Process Gemini's markdown response to HTML
    const processResponseToHTML = (text: string): string => {
        // Replace markdown-style links with HTML links
        let html = text.replace(/\*\*<a href="([^"]+)" target="([^"]+)" rel="([^"]+)">([^<]+)<\/a>\*\*/g,
            '<a href="$1" target="$2" rel="$3" class="text-blue-600 hover:underline">$4</a>');

        // Replace other formatting
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'); // Bold text
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>'); // Italic text

        // Replace line breaks with <br> tags
        html = html.replace(/\n/g, '<br>');

        // Sanitize HTML to prevent XSS
        return DOMPurify.sanitize(html);
    };

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input on load
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim()) return;

        // Add user message to chat
        const userMessage: Message = {
            text: input,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Initialize model and chat session
            const model = await initializeGeminiAPI();
            const chatSession = model.startChat();

            // Get response from Gemini
            const PROMPT = `
        You are an AI assistant for a Petition Management Application. Your goal is to help users create and manage petitions efficiently by generating well-crafted content they can easily copy and paste. Provide direct links where applicable to help users take action immediately. Ensure the generated content is clear, professional, and persuasive. If the user provides incomplete information, ask clarifying questions to fill in the gaps. Maintain a helpful and professional tone.

        ### Key Instructions for AI Behavior:
        1. **Generate Petition Content:**  
        - Based on the user's input, generate a compelling petition title and description.  
        - Ensure the content is easy to copy and paste.  

        2. **Provide Direct Links:**  
        - Include actionable links for easy access to the platform.  
        - Format links as clickable hyperlinks.  

        3. **Suggestions for Improvement:**  
        - Provide tips to make the petition more engaging and clear.  
        - Highlight any missing information and ask clarifying questions.  

        4. **Status and Tracking:**  
        - Provide links to track petition progress or view active petitions.  
        - If available, give users links to share the petition.  

        5. **Professional and Helpful Tone:**  
        - Keep responses clear, concise, and professional.  
        - Encourage users to act by using a supportive and positive tone.  

        ### Important for Response Formatting:
        - DO NOT use markdown for links; use proper HTML instead.
        - Example for links: <a href="http://localhost:5173/grievance/new" target="_blank" rel="noopener noreferrer">Create a New Petition</a>
        - Use standard HTML for any formatting needed.

        User Input: ${input}
    `;
            const result = await chatSession.sendMessage(PROMPT);
            const responseText = result.response.text();

            // Process the response text into HTML
            const processedHTML = processResponseToHTML(responseText);

            // Add bot response to chat
            const botMessage: Message = {
                text: responseText,
                sender: 'bot',
                timestamp: new Date(),
                html: processedHTML // Add the HTML version
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message:', error);

            // Add error message
            const errorMessage: Message = {
                text: 'Sorry, I encountered an error. Please try again later.',
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch user data when component mounts
    const fetchUserData = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setUser(response.data.user);
        } catch (err: any) {
            console.error('Error fetching user data:', err);

            if (err.response && err.response.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    };

    // Initialize chatbot with welcome message
    useEffect(() => {
        const initializeChat = async () => {
            await fetchUserData();

            if (messages.length === 0 && user?.name) {
                setMessages([
                    {
                        text: `Hi ${user.name}! I'm here to help you with your petition. Please describe the issue you want to create a petition for.`,
                        sender: 'bot',
                        timestamp: new Date(),
                    },
                ]);
            } else if (messages.length === 0) {
                setMessages([
                    {
                        text: `Hi there! I'm here to help you with your petition. Please describe the issue you want to create a petition for.`,
                        sender: 'bot',
                        timestamp: new Date(),
                    },
                ]);
            }
        };

        initializeChat();
    }, [user?.name]);

    // Get first letter of name for avatar (same as in ProfilePage)
    const getInitial = (name: string) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    // Generate random gradient background for avatar (same as in ProfilePage)
    const getAvatarBg = () => {
        const colors = [
            'from-purple-500 to-indigo-600',
            'from-blue-500 to-teal-400',
            'from-green-500 to-lime-400',
            'from-pink-500 to-rose-400',
            'from-amber-500 to-yellow-400'
        ];
        // Use user's name to consistently get the same color
        const index = user?.name ? user.name.length % colors.length : 0;
        return colors[index];
    };

    return (
        <div className="min-w-full min-h-[91.8vh] max-h-[91.8vh] dark:bg-background-100">
            <Navbar />
            <div className="min-h-[80vh] dark:bg-background-100 py-6 px-4 sm:px-6 lg:px-8 mt-16">
                {/* Chat Messages */}
                <div className="flex-1 min-h-[70vh] max-h-[70vh] overflow-y-scroll p-6 rounded-lg bg-gray-50 dark:bg-background-200 shadow-inner mb-4">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                            <div className="text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                <p className="mt-2 text-sm">Loading conversation...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                                >
                                    {message.sender === 'bot' && (
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold mr-3 flex-shrink-0 self-start shadow-md">
                                            AI
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-2xl p-4 rounded-2xl shadow-md ${message.sender === 'user'
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                                                : 'bg-white dark:bg-background-300 text-gray-800 dark:text-white rounded-bl-none border border-gray-100 dark:border-gray-700'
                                            }`}
                                    >
                                        {message.html ? (
                                            <div
                                                className="prose dark:prose-invert prose-sm sm:prose-base max-w-none"
                                                dangerouslySetInnerHTML={{ __html: message.html }}
                                            />
                                        ) : (
                                            <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{message.text}</p>
                                        )}
                                        <p className="text-xs opacity-70 mt-2 text-right">
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    {message.sender === 'user' && (
                                        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarBg()} flex items-center justify-center text-white font-bold ml-3 flex-shrink-0 self-start shadow-md`}>
                                            {user?.name ? getInitial(user.name) : '?'}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Form */}
                <form onSubmit={handleSendMessage} className="bg-white dark:bg-background-300 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Describe your petition issue..."
                            className="flex-1 p-4 bg-gray-50 dark:bg-background-200 dark:text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 border-none"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-r-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 transition-all duration-200 font-medium"
                            disabled={isLoading || !input.trim()}
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <span>Send</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatbotPage;