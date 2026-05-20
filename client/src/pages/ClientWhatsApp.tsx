import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, MessageSquare, Plus, Trash2 } from "lucide-react";

interface Message {
  id: number;
  phone: string;
  message: string;
  timestamp: string;
  sent: boolean;
}

interface Template {
  id: number;
  name: string;
  content: string;
}

export function ClientWhatsApp() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"messages" | "templates">("messages");
  const [messageText, setMessageText] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateContent, setTemplateContent] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      phone: "(11) 98765-4321",
      message: "Olá! Gostaria de saber o preço da camiseta azul.",
      timestamp: "10:30",
      sent: false,
    },
    {
      id: 2,
      phone: "(11) 98765-4321",
      message: "A camiseta azul custa R$ 49,90",
      timestamp: "10:35",
      sent: true,
    },
  ]);

  const [templates, setTemplates] = useState<Template[]>([
    {
      id: 1,
      name: "Boas-vindas",
      content: "Olá! Bem-vindo à nossa loja. Como posso ajudar?",
    },
    {
      id: 2,
      name: "Promoção",
      content: "Confira nossa promoção especial: 30% de desconto em todas as camisetas!",
    },
    {
      id: 3,
      name: "Confirmação de Pedido",
      content: "Seu pedido foi confirmado! Número do pedido: #12345",
    },
  ]);

  const handleSendMessage = () => {
    if (!messageText) return;

    const newMessage: Message = {
      id: messages.length + 1,
      phone: "(11) 98765-4321",
      message: messageText,
      timestamp: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sent: true,
    };

    setMessages([...messages, newMessage]);
    setMessageText("");
  };

  const handleAddTemplate = () => {
    if (!templateName || !templateContent) return;

    const newTemplate: Template = {
      id: templates.length + 1,
      name: templateName,
      content: templateContent,
    };

    setTemplates([...templates, newTemplate]);
    setTemplateName("");
    setTemplateContent("");
  };

  const handleDeleteTemplate = (id: number) => {
    setTemplates(templates.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/client-dashboard")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-white">WhatsApp</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-700">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("messages")}
            className={`${
              activeTab === "messages"
                ? "text-yellow-500 border-b-2 border-yellow-500"
                : "text-slate-400"
            } rounded-none`}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Mensagens
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("templates")}
            className={`${
              activeTab === "templates"
                ? "text-yellow-500 border-b-2 border-yellow-500"
                : "text-slate-400"
            } rounded-none`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Templates
          </Button>
        </div>

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversation List */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-800 border-slate-700 h-96 overflow-y-auto">
                <CardHeader>
                  <CardTitle className="text-sm">Conversas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { phone: "(11) 98765-4321", name: "João Silva", unread: 0 },
                    { phone: "(11) 91234-5678", name: "Maria Santos", unread: 2 },
                    { phone: "(11) 99876-5432", name: "Pedro Costa", unread: 0 },
                  ].map((conv) => (
                    <div
                      key={conv.phone}
                      className="p-3 bg-slate-700 rounded-lg hover:bg-slate-600 cursor-pointer transition"
                    >
                      <p className="font-medium text-white">{conv.name}</p>
                      <p className="text-xs text-slate-400">{conv.phone}</p>
                      {conv.unread > 0 && (
                        <span className="inline-block mt-1 bg-yellow-500 text-slate-900 text-xs px-2 py-1 rounded-full font-medium">
                          {conv.unread} novo
                        </span>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-800 border-slate-700 h-96 flex flex-col">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-sm">João Silva - (11) 98765-4321</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-4 py-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sent ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.sent
                            ? "bg-yellow-500 text-slate-900"
                            : "bg-slate-700 text-white"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs mt-1 opacity-70">{msg.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <div className="border-t border-slate-700 p-4 space-y-3">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            {/* Add Template */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Criar Novo Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nome do Template
                  </label>
                  <Input
                    placeholder="Ex: Boas-vindas"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Conteúdo
                  </label>
                  <textarea
                    placeholder="Digite o conteúdo da mensagem..."
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-3 min-h-24"
                  />
                </div>
                <Button
                  onClick={handleAddTemplate}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Template
                </Button>
              </CardContent>
            </Card>

            {/* Templates List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-400">{template.content}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4 border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Usar Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
