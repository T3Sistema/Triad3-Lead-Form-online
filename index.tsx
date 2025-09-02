import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

const LOGO_URL = 'https://aisfizoyfpcisykarrnt.supabase.co/storage/v1/object/public/imagens/LOGO%20TRIAD3%20.png';
const WEBHOOK_URL = 'https://webhook.triad3.io/webhook/colet-dados-2025';

const questions = [
    { key: 'storeName', prompt: 'Olá! Para começarmos, qual é o nome da sua loja?', label: 'Nome da Loja' },
    { key: 'contactName', prompt: 'Ótimo! E qual é o nome do responsável que receberá os leads?', label: 'Nome do Responsável' },
    { key: 'phone', prompt: 'Qual o número de telefone (com DDD) para contato?', label: 'Telefone', type: 'tel' },
    { key: 'email', prompt: 'Para finalizar, qual o e-mail do responsável que receberá os leads?', label: 'Email do Responsável', type: 'email' },
];

const App = () => {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        storeName: '',
        contactName: '',
        phone: '',
        email: '',
    });
    const [currentInput, setCurrentInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [editConfirmationIndex, setEditConfirmationIndex] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const chatWindowRef = useRef(null);

    useEffect(() => {
        setIsTyping(true);
        setTimeout(() => {
            if (messages.length === 0) {
                 setMessages([{ sender: 'bot', text: questions[0].prompt }]);
            }
            setIsTyping(false);
        }, 1000);
    }, []);

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleInputChange = (e) => {
        setCurrentInput(e.target.value);
    };

    const handleNextStep = (e) => {
        e.preventDefault();
        if (!currentInput.trim()) return;

        const userMessage = { sender: 'user', text: currentInput };
        setMessages(prev => [...prev, userMessage]);
        
        const currentQuestionKey = questions[step].key;
        setFormData(prev => ({ ...prev, [currentQuestionKey]: currentInput }));
        setCurrentInput('');
        setIsTyping(true);

        setTimeout(() => {
            setIsTyping(false);
            if (isEditing) {
                setIsEditing(false); // Reset editing mode
                setStep(questions.length); // Go back to summary
                setMessages(prev => [...prev, { sender: 'bot', text: 'Perfeito! Por favor, confirme se os dados estão corretos:' }]);
            } else {
                const nextStep = step + 1;
                if (nextStep < questions.length) {
                    setMessages(prev => [...prev, { sender: 'bot', text: questions[nextStep].prompt }]);
                } else {
                    setMessages(prev => [...prev, { sender: 'bot', text: 'Perfeito! Por favor, confirme se os dados estão corretos:' }]);
                }
                setStep(nextStep);
            }
        }, 1200 + Math.random() * 400);
    };

    const requestEdit = (index) => {
        setEditConfirmationIndex(index);
    };
    
    const cancelEdit = () => {
        setEditConfirmationIndex(null);
    };
    
    const proceedWithEdit = () => {
        const stepIndex = editConfirmationIndex;
        setEditConfirmationIndex(null);
        setIsEditing(true);

        setStep(stepIndex);
        const keyToEdit = questions[stepIndex].key;
        setCurrentInput(formData[keyToEdit]);
        const editMessage = { sender: 'bot', text: `Claro, vamos corrigir o "${questions[stepIndex].label}". Qual é o valor correto?` };
        
        const newMessages = messages.filter(m => m.text !== 'Perfeito! Por favor, confirme se os dados estão corretos:');
        newMessages.push(editMessage)
        setMessages(newMessages);
    };


    const handleConfirm = async () => {
        setIsSubmitted(true); // Hides the summary card and buttons

        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error(`Webhook failed with status ${response.status}`);
            }

            // Success
            const summaryText = `Dados Confirmados:\n${questions.map(q => `• ${q.label}: ${formData[q.key]}`).join('\n')}`;
            setMessages(prev => [...prev, { sender: 'bot', text: summaryText }]);
            
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
                setMessages(prev => [...prev, { sender: 'bot', text: 'Obrigado! Seus dados foram recebidos. Em breve entraremos em contato.' }]);
            }, 1000);

        } catch (error) {
            console.error("Failed to submit:", error);
            setMessages(prev => [...prev, { sender: 'bot', text: 'Ops! Ocorreu um erro ao enviar. Por favor, tente confirmar novamente.' }]);
            setIsSubmitted(false); // Re-enable the confirm button to allow retry
        }
    };

    return (
        <div className="app-container">
            <header className="header">
                <img src={LOGO_URL} alt="Triad3 Logo" />
                <h1>Triad3 Inteligência Digital</h1>
            </header>
            <main className="chat-window" ref={chatWindowRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}-message`}>
                        {msg.text}
                    </div>
                ))}
                {isTyping && (
                    <div className="message bot-message typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                )}
                {step === questions.length && !isSubmitted && (
                    <>
                        {editConfirmationIndex === null ? (
                            <div className="summary-card">
                                <h3>Resumo dos Dados</h3>
                                {questions.map((q, index) => (
                                    <div className="summary-item" key={q.key}>
                                        <div>
                                            <strong>{q.label}</strong>
                                            <span>{formData[q.key]}</span>
                                        </div>
                                        <button onClick={() => requestEdit(index)}>Editar</button>
                                    </div>
                                ))}
                                <div className="confirmation-buttons">
                                    <button className="confirm-btn" onClick={handleConfirm}>Tudo Certo!</button>
                                </div>
                            </div>
                        ) : (
                            <div className="summary-card edit-confirmation">
                                <h3>Confirmar Edição</h3>
                                <p>Você tem certeza que deseja editar o campo "{questions[editConfirmationIndex].label}"?</p>
                                <div className="confirmation-buttons">
                                    <button className="confirm-btn" onClick={proceedWithEdit}>Sim, Editar</button>
                                    <button className="cancel-btn" onClick={cancelEdit}>Cancelar</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
            {step < questions.length && !isSubmitted && (
                <form className="input-area" onSubmit={handleNextStep}>
                    <input
                        type={questions[step]?.type || 'text'}
                        value={currentInput}
                        onChange={handleInputChange}
                        placeholder="Digite aqui..."
                        aria-label="Resposta do usuário"
                        autoFocus
                    />
                    <button type="submit" aria-label="Enviar resposta" disabled={!currentInput.trim() || isTyping}>
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                           <path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path>
                        </svg>
                    </button>
                </form>
            )}
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);