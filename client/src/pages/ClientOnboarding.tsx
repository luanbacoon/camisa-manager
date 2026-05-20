import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Shirt } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Bem-vindo ao CamisaManager!",
    description: "Sua plataforma de gerenciamento de loja de camisas",
    icon: "🎉",
  },
  {
    number: 2,
    title: "Gerencie seus Produtos",
    description: "Cadastre seus produtos, tamanhos e preços facilmente",
    icon: "👕",
  },
  {
    number: 3,
    title: "Controle seu Estoque",
    description: "Acompanhe o estoque em tempo real",
    icon: "📦",
  },
  {
    number: 4,
    title: "Registre suas Vendas",
    description: "Registre e acompanhe todas as suas vendas",
    icon: "💰",
  },
  {
    number: 5,
    title: "Gerencie Clientes",
    description: "Mantenha um registro de todos os seus clientes",
    icon: "👥",
  },
  {
    number: 6,
    title: "Pronto para começar!",
    description: "Você está pronto para usar o CamisaManager",
    icon: "🚀",
  },
];

export function ClientOnboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as complete and redirect to dashboard
      localStorage.setItem("onboardingComplete", "true");
      setLocation("/client-dashboard");
    }
  };

  const handleSkip = () => {
    localStorage.setItem("onboardingComplete", "true");
    setLocation("/client-dashboard");
  };

  const step = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-800 border-slate-700">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-500 p-4 rounded-lg">
              <Shirt className="w-12 h-12 text-slate-900" />
            </div>
          </div>
          <CardTitle className="text-4xl mb-2">CamisaManager</CardTitle>
          <p className="text-slate-400">Seu sistema de gerenciamento de loja</p>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Progress Bar */}
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? "bg-yellow-500" : "bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="text-center space-y-6">
            <div className="text-6xl">{step.icon}</div>
            <div>
              <p className="text-sm text-yellow-500 font-medium mb-2">
                Passo {step.number} de {steps.length}
              </p>
              <h2 className="text-3xl font-bold text-white mb-3">{step.title}</h2>
              <p className="text-lg text-slate-400">{step.description}</p>
            </div>
          </div>

          {/* Features Grid (visible on last step) */}
          {currentStep === steps.length - 1 && (
            <div className="grid grid-cols-2 gap-4 mt-8">
              {[
                { icon: "📊", label: "Relatórios" },
                { icon: "💬", label: "WhatsApp" },
                { icon: "📱", label: "Catálogo" },
                { icon: "🔒", label: "Seguro" },
              ].map((feature, index) => (
                <div key={index} className="bg-slate-700 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">{feature.icon}</div>
                  <p className="text-sm text-slate-300">{feature.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Pular
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Começar
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
