import React from "react";

export default function ImpressaoRomaneio({ romaneio }) {
  if (!romaneio) return null;

  const agora = new Date();
  const dataHoraHeader = agora.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const dataImpressao = agora.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formatarData = (data) => {
    if (!data) return '-';
    const d = new Date(data + 'T12:00:00');
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="print-only">
      <style>{`
        /* Esconder na tela */
        @media screen {
          .print-only {
            display: none !important;
          }
        }

        @media print {
          @page {
            margin: 5mm;
            size: auto;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden;
          }
          .print-only, .print-only * {
            visibility: visible !important;
          }
          .print-only {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }

        .print-page {
          font-family: Arial, sans-serif;
          font-size: 12px;
          color: #000;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .print-header-top {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #666;
          padding-bottom: 10px;
          border-bottom: 1px solid #ddd;
          margin-bottom: 20px;
        }

        .print-title {
          text-align: center;
          margin-bottom: 15px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .print-logo-img {
          width: 150px;
          height: auto;
          margin-bottom: 10px;
        }

        .print-title h1 {
          font-size: 18px;
          font-weight: bold;
          margin: 0;
        }

        .print-box {
          border: 1px solid #ddd;
          padding: 12px;
          margin-bottom: 10px;
        }

        .print-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }

        .print-row:last-child {
          margin-bottom: 0;
        }

        .print-label {
          color: #666;
          font-size: 11px;
        }

        .print-value {
          text-align: right;
        }

        .print-value-bold {
          font-weight: bold;
          text-align: right;
        }

        .print-grid {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .print-grid-col {
          flex: 1;
          border: 1px solid #ddd;
          padding: 12px 15px;
        }

        .print-section-title {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 1px solid #eee;
        }

        .print-section-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 11px;
        }

        .print-section-row:last-child {
          margin-bottom: 0;
        }

        .print-section-label {
          color: #666;
        }

        .print-section-value {
          text-align: right;
        }

        .print-endereco-main {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 3px;
        }

        .print-endereco-line {
          font-size: 11px;
          margin-bottom: 2px;
        }

        .print-endereco-ref {
          font-size: 11px;
          color: #666;
          font-style: italic;
          margin-top: 3px;
        }

        .print-endereco-ac {
          font-size: 11px;
          margin-top: 3px;
        }

        .print-geladeira {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px 15px;
          margin-bottom: 10px;
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
          border: 2px solid #2196F3;
          background-color: #E3F2FD;
          color: #1565C0;
        }

        .print-geladeira-icon {
          font-size: 20px;
        }

        .print-receita {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px 15px;
          margin-bottom: 10px;
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
          border: 2px solid #FF9800;
          background-color: #FFF3E0;
          color: #E65100;
        }

        .print-receita-icon {
          font-size: 20px;
        }

        .print-valor-box {
          background-color: #FFFDE7;
          border: 2px solid #FBC02D;
          padding: 10px;
          margin-bottom: 10px;
          text-align: center;
          font-size: 14px;
          font-weight: bold;
        }

        .print-valor-icon {
          margin-right: 8px;
        }

        .print-footer {
          text-align: center;
          font-size: 9px;
          color: #666;
          padding-top: 8px;
          border-top: 1px solid #ddd;
          margin-top: 10px;
        }

        .print-footer div {
          margin-bottom: 2px;
        }
      `}</style>

      <div className="print-page">
        {/* Logo e Titulo */}
        <div className="print-title">
          <img src="/logo-formedica.png" alt="Formédica" className="print-logo-img" />
          <h1>ROMANEIO DE ENTREGA</h1>
        </div>

        {/* Info Principal e Cliente */}
        <div className="print-grid">
          <div className="print-grid-col">
            <div className="print-section-title">DADOS DA ENTREGA</div>
            <div className="print-section-row">
              <span className="print-section-label">N. Requisição:</span>
              <span className="print-section-value" style={{fontWeight: 'bold'}}># {romaneio.requisicao || '0000'}</span>
            </div>
            <div className="print-section-row">
              <span className="print-section-label">Data:</span>
              <span className="print-section-value">{formatarData(romaneio.data_entrega)} - {romaneio.periodo || '-'}</span>
            </div>
            <div className="print-section-row">
              <span className="print-section-label">Motoboy:</span>
              <span className="print-section-value">{romaneio.motoboy?.nome || '-'}</span>
            </div>
            <div className="print-section-row">
              <span className="print-section-label">Atendente:</span>
              <span className="print-section-value">{romaneio.atendente?.nome || romaneio.atendente?.email || '-'}</span>
            </div>
          </div>

          <div className="print-grid-col">
            <div className="print-section-title">CLIENTE</div>
            <div className="print-section-row">
              <span className="print-section-label">Nome:</span>
              <span className="print-section-value">{romaneio.cliente?.nome || '-'}</span>
            </div>
            <div className="print-section-row">
              <span className="print-section-label">Telefone:</span>
              <span className="print-section-value">{romaneio.cliente?.telefone || '-'}</span>
            </div>
          </div>
        </div>

        {/* Endereco e Pagamento */}
        <div className="print-grid">
          <div className="print-grid-col">
            <div className="print-section-title">ENDERECO DE ENTREGA</div>
            <div className="print-endereco-main">
              {romaneio.endereco?.logradouro || '-'} , {romaneio.endereco?.numero || 'S/N'}
            </div>
            <div className="print-endereco-line">
              {romaneio.endereco?.bairro || '-'} - {romaneio.endereco?.cidade || romaneio.regiao || '-'}
            </div>
            {romaneio.endereco?.complemento && (
              <div className="print-endereco-line">
                Compl.: {romaneio.endereco.complemento}
              </div>
            )}
            {romaneio.endereco?.ponto_referencia && (
              <div className="print-endereco-ref">
                Ref.: {romaneio.endereco.ponto_referencia}
              </div>
            )}
            {romaneio.cliente?.nome && (
              <div className="print-endereco-ac">
                A/C: {romaneio.cliente.nome}
              </div>
            )}
          </div>

          <div className="print-grid-col">
            <div className="print-section-title">PAGAMENTO</div>
            <div className="print-section-row">
              <span className="print-section-label">Forma de Pagamento:</span>
              <span className="print-section-value">{romaneio.forma_pagamento || '-'}</span>
            </div>
          </div>
        </div>

        {/* Item Geladeira */}
        {romaneio.item_geladeira && (
          <div className="print-geladeira">
            <span className="print-geladeira-icon">❄</span>
            <span>ITEM DE GELADEIRA - MANTER REFRIGERADO</span>
            <span className="print-geladeira-icon">❄</span>
          </div>
        )}

        {/* Buscar Receita */}
        {romaneio.buscar_receita && (
          <div className="print-receita">
            <span className="print-receita-icon">📋</span>
            <span>RETER RECEITA</span>
            <span className="print-receita-icon">📋</span>
          </div>
        )}

        {/* Valor a Cobrar */}
        {romaneio.valor_venda > 0 && ['Receber Dinheiro', 'Receber Máquina', 'Pagar MP'].includes(romaneio.forma_pagamento) && (
          <div className="print-valor-box">
            <span className="print-valor-icon">$</span>
            COBRAR NA ENTREGA: R$ {romaneio.valor_venda.toFixed(2).replace('.', ',')}
          </div>
        )}

        {/* Troco */}
        {romaneio.precisa_troco && romaneio.valor_troco > 0 && (
          <div className="print-valor-box" style={{ backgroundColor: '#FFF3E0', borderColor: '#FF9800' }}>
            TROCO: R$ {romaneio.valor_troco.toFixed(2).replace('.', ',')}
          </div>
        )}

        {/* Footer */}
        <div className="print-footer">
          <div>Impressao em: {dataImpressao}</div>
        </div>
      </div>
    </div>
  );
}
