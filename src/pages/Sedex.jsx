import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";

export default function Sedex() {
  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Sedex / Disktenha
          </h1>
          <p className="text-slate-600">
            Gerencie entregas via Sedex e Disktenha
          </p>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <Send className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Em Desenvolvimento
            </h3>
            <p className="text-slate-600">
              Esta funcionalidade estará disponível em breve
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}