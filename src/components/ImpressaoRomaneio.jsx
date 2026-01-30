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
          position: relative;
        }

        .print-header-top {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #000;
          padding-bottom: 10px;
          border-bottom: 1px solid #000;
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
          color: #000;
        }

        .print-box {
          border: 1px solid #000;
          padding: 12px;
          margin-bottom: 10px;
        }

        .print-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          color: #000;
        }

        .print-row:last-child {
          margin-bottom: 0;
        }

        .print-label {
          color: #000;
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
          border: 1px solid #000;
          padding: 12px 15px;
        }

        .print-section-title {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 1px solid #000;
          color: #000;
        }

        .print-section-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 11px;
          color: #000;
        }

        .print-section-row:last-child {
          margin-bottom: 0;
        }

        .print-section-label {
          color: #000;
        }

        .print-section-value {
          text-align: right;
          color: #000;
        }

        .print-endereco-main {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 3px;
          color: #000;
        }

        .print-endereco-line {
          font-size: 11px;
          margin-bottom: 2px;
          color: #000;
        }

        .print-endereco-ref {
          font-size: 11px;
          color: #000;
          font-style: italic;
          margin-top: 3px;
        }

        .print-endereco-ac {
          font-size: 11px;
          margin-top: 3px;
          color: #000;
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
          border: 2px solid #000;
          background-color: #fff;
          color: #000;
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
          border: 2px solid #000;
          background-color: #fff;
          color: #000;
        }

        .print-receita-icon {
          font-size: 20px;
        }

        .print-valor-box {
          background-color: #fff;
          border: 2px solid #000;
          padding: 10px;
          margin-bottom: 10px;
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          color: #000;
        }

        .print-valor-icon {
          margin-right: 8px;
        }

        .print-footer {
          text-align: center;
          font-size: 9px;
          color: #000;
          padding-top: 8px;
          border-top: 1px solid #000;
          margin-top: 10px;
        }

        .print-footer div {
          margin-bottom: 2px;
        }

        .print-carimbo-pago {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-25deg);
          font-size: 80px;
          font-weight: bold;
          text-transform: uppercase;
          color: #000;
          border: 8px solid #000;
          padding: 10px 40px;
          opacity: 0.3;
          pointer-events: none;
          z-index: 100;
          letter-spacing: 10px;
        }
      `}</style>

      <div className="print-page">
        {/* Carimbo PAGO - aparece quando pagamento recebido ou forma de pagamento Pago/Só Entregar */}
        {(romaneio.pagamento_recebido || (romaneio.forma_pagamento && ['Pago', 'Só Entregar'].includes(romaneio.forma_pagamento))) && (
          <div className="print-carimbo-pago">PAGO</div>
        )}

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

        {/* Observações */}
        {romaneio.observacoes && (
          <div className="print-box">
            <div className="print-section-title">OBSERVAÇÕES</div>
            <div className="print-section-row" style={{ justifyContent: 'flex-start' }}>
              <span className="print-section-value" style={{ textAlign: 'left' }}>{romaneio.observacoes}</span>
            </div>
          </div>
        )}

        {/* Item Geladeira e Reter Receita - lado a lado */}
        {(romaneio.item_geladeira || romaneio.buscar_receita) && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            {romaneio.item_geladeira && (
              <div className="print-geladeira" style={{ flex: 1, marginBottom: 0 }}>
                <span className="print-geladeira-icon">❄</span>
                <span>ITEM DE GELADEIRA</span>
                <span className="print-geladeira-icon">❄</span>
              </div>
            )}
            {romaneio.buscar_receita && (
              <div className="print-receita" style={{ flex: 1, marginBottom: 0 }}>
                <svg className="print-receita-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '20px', height: '20px'}}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>RETER RECEITA</span>
                <svg className="print-receita-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '20px', height: '20px'}}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Valor a Cobrar e Troco - lado a lado */}
        {(romaneio.valor_venda > 0 && ['Receber Dinheiro', 'Receber Máquina', 'Pagar MP'].includes(romaneio.forma_pagamento)) || (romaneio.precisa_troco && romaneio.valor_troco > 0) ? (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            {romaneio.valor_venda > 0 && ['Receber Dinheiro', 'Receber Máquina', 'Pagar MP'].includes(romaneio.forma_pagamento) && (
              <div className="print-valor-box" style={{ flex: 1, marginBottom: 0 }}>
                <span className="print-valor-icon">$</span>
                COBRAR NA ENTREGA: R$ {romaneio.valor_venda.toFixed(2).replace('.', ',')}
              </div>
            )}
            {romaneio.precisa_troco && romaneio.valor_troco > 0 && (
              <div className="print-valor-box" style={{ flex: 1, marginBottom: 0 }}>
                TROCO: R$ {romaneio.valor_troco.toFixed(2).replace('.', ',')}
              </div>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="print-footer">
          <div>Impressao em: {dataImpressao}</div>
        </div>
      </div>
    </div>
  );
}
