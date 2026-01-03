import React from "react";
import { Snowflake, AlertTriangle } from "lucide-react";

export default function ImpressaoRomaneio({ romaneio }) {
  if (!romaneio) return null;

  return (
    <div className="print-only" style={{ display: 'none' }}>
      <style>{`
        @media print {
          .print-only {
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .print-container {
            width: 100%;
            height: 50vh;
            padding: 15px;
            font-family: Arial, sans-serif;
            font-size: 11px;
            page-break-after: always;
          }
          .print-header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .print-title {
            font-size: 16px;
            font-weight: bold;
            margin: 0;
          }
          .print-subtitle {
            font-size: 10px;
            color: #666;
            margin: 2px 0 0 0;
          }
          .print-section {
            margin-bottom: 10px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          .print-section-title {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 6px;
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 3px;
          }
          .print-row {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
          }
          .print-label {
            font-weight: bold;
            color: #555;
          }
          .print-value {
            color: #000;
          }
          .print-highlight {
            background-color: #ffffcc;
            padding: 6px;
            border-left: 3px solid #ffa500;
            margin: 8px 0;
            font-weight: bold;
          }
          .print-geladeira {
            background-color: #ccf0ff;
            padding: 6px;
            border-left: 3px solid #00aaff;
            margin: 8px 0;
            font-weight: bold;
            text-align: center;
          }
          .print-receita {
            background-color: #fff9cc;
            padding: 6px;
            border-left: 3px solid #ffcc00;
            margin: 8px 0;
            font-weight: bold;
            text-align: center;
          }
          .print-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .print-valor-destaque {
            background-color: #ffffaa;
            padding: 10px;
            border: 3px solid #ff6600;
            margin: 8px 0;
            font-weight: bold;
            text-align: center;
            font-size: 16px;
          }
          .print-footer {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px dashed #999;
            text-align: center;
            font-size: 10px;
            color: #666;
          }
        }
      `}</style>

      <div className="print-container">
        {/* Header */}
        <div className="print-header">
          <h1 className="print-title">ROMANEIO DE ENTREGA</h1>
          <p className="print-subtitle">Sistema de Gestão de Entregas</p>
        </div>

        {/* Informações Principais */}
        <div className="print-section">
          <div className="print-row">
            <span className="print-label">Nº REQUISIÇÃO:</span>
            <span className="print-value" style={{ fontSize: '14px', fontWeight: 'bold' }}>
              #{romaneio.numero_requisicao}
            </span>
          </div>
          <div className="print-row">
            <span className="print-label">DATA ENTREGA:</span>
            <span className="print-value">
              {romaneio.data_entrega_prevista && new Date(romaneio.data_entrega_prevista).toLocaleDateString('pt-BR')} - {romaneio.periodo_entrega}
            </span>
          </div>
          <div className="print-row">
            <span className="print-label">STATUS:</span>
            <span className="print-value">{romaneio.status}</span>
          </div>
        </div>

        {/* Cliente e Responsáveis */}
        <div className="print-grid">
          <div className="print-section">
            <div className="print-section-title">CLIENTE</div>
            <div className="print-row">
              <span className="print-label">Nome:</span>
              <span className="print-value">{romaneio.cliente_nome}</span>
            </div>
            {romaneio.cliente_telefone && (
              <div className="print-row">
                <span className="print-label">Telefone:</span>
                <span className="print-value">{romaneio.cliente_telefone}</span>
              </div>
            )}
          </div>

          <div className="print-section">
            <div className="print-section-title">RESPONSÁVEIS</div>
            <div className="print-row">
              <span className="print-label">Atendente:</span>
              <span className="print-value">{romaneio.atendente_nome}</span>
            </div>
            <div className="print-row">
              <span className="print-label">Motoboy:</span>
              <span className="print-value">{romaneio.motoboy}</span>
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="print-section">
          <div className="print-section-title">ENDEREÇO DE ENTREGA</div>
          <div className="print-value" style={{ fontSize: '12px', fontWeight: 'bold' }}>
            {romaneio.endereco.rua}, {romaneio.endereco.numero}
          </div>
          <div className="print-value">
            {romaneio.endereco.bairro} - {romaneio.cidade_regiao}
          </div>
          {romaneio.endereco.complemento && (
            <div className="print-value">Compl: {romaneio.endereco.complemento}</div>
          )}
          {romaneio.endereco.ponto_referencia && (
            <div className="print-value" style={{ fontStyle: 'italic' }}>
              Ref: {romaneio.endereco.ponto_referencia}
            </div>
          )}
          {romaneio.endereco.aos_cuidados_de && (
            <div className="print-value" style={{ fontWeight: 'bold' }}>
              A/C: {romaneio.endereco.aos_cuidados_de}
            </div>
          )}
        </div>

        {/* Pagamento */}
        <div className="print-section">
          <div className="print-section-title">PAGAMENTO</div>
          <div className="print-row">
            <span className="print-label">Forma:</span>
            <span className="print-value" style={{ fontSize: '12px', fontWeight: 'bold' }}>
              {romaneio.forma_pagamento}
            </span>
          </div>
        </div>

        {/* Destaque especial para TROCO */}
        {romaneio.precisa_troco && romaneio.valor_troco > 0 && (
          <div style={{
            border: '3px solid #ff9800',
            backgroundColor: '#fff3e0',
            padding: '10px',
            marginTop: '10px',
            borderRadius: '5px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#e65100',
              marginBottom: '5px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}>
              <AlertTriangle style={{ width: '16px', height: '16px' }} />
              PRECISA DE TROCO
              <AlertTriangle style={{ width: '16px', height: '16px' }} />
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#e65100'
            }}>
              Cliente pagará com: R$ {romaneio.valor_troco.toFixed(2)}
            </div>
          </div>
        )}

        {/* Observações */}
        {(romaneio.observacoes || romaneio.endereco.observacoes) && (
          <div className="print-highlight">
            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '3px' }}>
              ⚠️ OBSERVAÇÕES IMPORTANTES:
            </div>
            {romaneio.observacoes && <div>{romaneio.observacoes}</div>}
            {romaneio.endereco.observacoes && <div>{romaneio.endereco.observacoes}</div>}
          </div>
        )}

        {/* Item de Geladeira */}
        {romaneio.item_geladeira && (
          <div className="print-geladeira">
            ❄️ ITEM DE GELADEIRA - MANTER REFRIGERADO
          </div>
        )}

        {/* Buscar Receita */}
        {romaneio.buscar_receita && (
          <div className="print-receita">
            📄 BUSCAR RECEITA
          </div>
        )}

        {/* VALOR A SER PAGO - POR ÚLTIMO EM DESTAQUE */}
        {romaneio.valor_pagamento && (
          <div className="print-valor-destaque">
            💰 COBRAR NA ENTREGA: R$ {romaneio.valor_pagamento.toFixed(2)}
          </div>
        )}

        {/* Footer */}
        <div className="print-footer">
          <div>Código de Rastreamento: {romaneio.codigo_rastreio}</div>
          <div>Impresso em: {new Date().toLocaleString('pt-BR')}</div>
        </div>
      </div>
    </div>
  );
}