import { BotMessageSquare, SendHorizonalIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import tailwindStyles from "../index.css?inline";

export const Widget = ({ chatbotId }: any) => {
  const [messages, setMessages] = useState<{sender: string, message: string, timestamp: Date}[] | []>([]);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>();
  const [activeInput, setActiveInput] = useState('chat');
  const [userInfo, setUserInfo] = useState({name: '', email: ''});
  const [chatbot, setChatbot] = useState<any>(null);
  const [botTyping, setBotTyping] = useState(false)

  useEffect(() => {
    const fetchChatbot = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chatbot/${chatbotId}`);
      const data = await response.json();
      setChatbot(data.chatbot)
    }

    fetchChatbot();
  }, [])
  

  const createNewSession = async () => {
    const data = {
      chatBot: chatbotId
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const { newSession } = await response.json();

    localStorage.setItem(`smartAssistChatSessionId`, newSession._id);

    setSessionId(newSession._id);

    return newSession._id;
  }

  useEffect(() => {
    const storedSessionId = localStorage.getItem(`smartAssistChatSessionId`);

    if (storedSessionId) {
      const getSession = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/session/${storedSessionId}`);
        
        const { session } = await response.json();

        if (!session || session.chatBot !== chatbotId) {
          setMessages([
            { sender: 'bot', message: 'Hello! Before we continue, may I have your name?', timestamp: new Date() },
          ]);
      
          setActiveInput('name')
        }
        
        setUserInfo({name: session?.user?.name, email: session?.user?.email})
        setSessionId(storedSessionId);
        setMessages(session?.chats);
      }
      getSession()
    } 
    else if (!storedSessionId) {
      setMessages([
        { sender: 'bot', message: 'Hello! Before we continue, may I have your name?', timestamp: new Date() },
      ]);
  
      setActiveInput('name')
    }
  }, []);


  const handleSaveUser = async () => {
    if (inputValue.trim() !== '') {

      setBotTyping(true);

      const newSession = await createNewSession();

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/session/${newSession}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user: { name: inputValue },
          chats: [
            { sender: 'bot', message: 'Hello! Before we continue, may I have your name?', timestamp: new Date() },
            { sender: 'bot', message: `Hello ${inputValue}!, How can I assist you?`, timestamp: new Date() }
          ]
        }),
      });
  
      const { session } = await response.json();

      setInputValue('');

      setBotTyping(false);

      setMessages(prev => [...prev, 
        { sender: 'bot', message: `Hello ${session?.user?.name}!, How can I assist you?`, timestamp: new Date() }
      ]);

      setActiveInput('chat')
    } 
  };


  const handleSendMessage = async () => {
    if (inputValue.trim() !== '') {
      setBotTyping(true)

      const userMessage = { sender: 'user', message: inputValue, timestamp: new Date() };

      // Update the state with the new user message
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, userMessage];
        return updatedMessages;
      });

      setInputValue('');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userInfo?.name, 
          message: inputValue, 
          shopDetails: chatbot?.predefinedInformation, 
          chats: [...messages, userMessage],
          sessionId: sessionId,
        }),      
      }) 
      const data = await response.json();

      setBotTyping(false)

      const botMessage = { sender: 'bot', message: data.data, timestamp: new Date() };

      // Update the state with the bot's response
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, botMessage];
        return updatedMessages;
      });
    } 
  };

  return (
    <>
    <style>{tailwindStyles}</style>
    <div className="fixed bottom-5 right-5 md:bottom-12 md:right-12 flex flex-col justify-end items-end w-[17rem] md:w-[20rem]">
      
      {/* Chat Box */}
      {isOpen && (
        <div style={{ borderRadius: "10px" }} className="bg-white shadow-lg rounded-lg overflow-hidden mt-3 w-full">
          <div style={{background: chatbot?.color }} className="p-4 bg-indigo-600 text-white flex items-center justify-between">
            <div className="flex flex-col items-start">
              <h4 className="font-bold">{chatbot?.name}</h4>
              <p className="text-xs">{chatbot?.description}</p>
            </div>
            <button
              className="bg-transparent text-white p-3 rounded-full"
              onClick={() => setIsOpen(!isOpen)}
            >
              <XIcon />
            </button>
          </div>
          <div className="p-4 h-64 overflow-y-auto text-sm">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === 'user' ? 'justify-end' : `justify-start`} w-full`}
              >
                <div
                  style={{ background: message.sender !== 'user' && chatbot?.color, borderRadius: "10px" }}
                  className={`${
                    message.sender === 'user' ? 'bg-gray-200 text-black' : 'bg-[#434343] text-white'
                  } p-2 rounded-md mb-2 max-w-[80%]`}
                >
                  {message.message}
                </div>
              </div>
            ))}
              {
                botTyping && (
                  <div className="flex justify-start">
                    <div
                      style={{ background: chatbot?.color, borderRadius: "10px" }}
                      className={`bg-[#434343] text-white px-4 py-3 rounded-md mb-2 flex items-center space-x-2`}
                    >
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-400"></div>
                    </div>
                  </div>
                )
              }
          </div>
          {
            activeInput == "name" ? 
            <div className="p-4 border-t border-gray-200 flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full border rounded px-2 mr-1 h-10 text-sm"
                placeholder="Enter your name..."
              />
              <button
                onClick={handleSaveUser}
                style={{background: chatbot?.color }}
                className="bg-indigo-600 text-white rounded w-12 h-10 flex items-center justify-center"
              >
                <SendHorizonalIcon className="h-4 w-4" />
              </button>
            </div>
            :
            <div className="p-4 border-t border-gray-200 flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full border rounded px-2 mr-1 h-10 text-sm"
                placeholder="Type a message..."
              />
              <button
                onClick={handleSendMessage}
                style={{background: chatbot?.color }}
                className="bg-indigo-600 text-white rounded w-12 h-10 flex items-center justify-center"
              >
                <SendHorizonalIcon className="h-4 w-4" />
              </button>
            </div>
          }
        </div>
      )}
      <button
          style={{background: chatbot?.color }}
          className="bg-indigo-600 text-white h-14 w-28 flex items-center justify-center rounded-full shadow-lg mt-4 animate-bounce"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <XIcon /> : <BotMessageSquare />}
      </button>
    </div>
    </>
  );
};
