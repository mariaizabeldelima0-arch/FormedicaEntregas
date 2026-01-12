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
          body * {
            visibility: hidden;
          }
          .print-only {
            display: block !important;
            visibility: visible !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-only * {
            visibility: visible !important;
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

        .print-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .print-logo-box {
          width: 28px;
          height: 28px;
          border: 2px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
        }

        .print-logo-text {
          font-size: 20px;
          font-weight: bold;
        }

        .print-title {
          text-align: center;
          margin-bottom: 25px;
        }

        .print-title h1 {
          font-size: 22px;
          font-weight: bold;
          margin: 0 0 5px 0;
        }

        .print-title p {
          font-size: 12px;
          color: #666;
          margin: 0;
        }

        .print-box {
          border: 1px solid #ddd;
          padding: 15px;
          margin-bottom: 15px;
        }

        .print-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
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
          gap: 15px;
          margin-bottom: 15px;
        }

        .print-grid-col {
          flex: 1;
          border: 1px solid #ddd;
          padding: 15px;
        }

        .print-section-title {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }

        .print-section-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
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

        .print-endereco {
          border: 1px solid #ddd;
          padding: 15px;
          margin-bottom: 15px;
        }

        .print-endereco-title {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }

        .print-endereco-main {
          font-weight: bold;
          font-size: 13px;
          margin-bottom: 5px;
        }

        .print-endereco-line {
          font-size: 11px;
          margin-bottom: 3px;
        }

        .print-endereco-ref {
          font-size: 11px;
          color: #666;
          font-style: italic;
          margin-top: 5px;
        }

        .print-endereco-ac {
          font-size: 11px;
          margin-top: 5px;
        }

        .print-pagamento {
          border: 1px solid #ddd;
          padding: 15px;
          margin-bottom: 15px;
        }

        .print-pagamento-title {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }

        .print-pagamento-row {
          display: flex;
          justify-content: space-between;
        }

        .print-pagamento-label {
          color: #666;
          font-size: 11px;
        }

        .print-pagamento-value {
          font-weight: bold;
        }

        .print-geladeira {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          margin-bottom: 10px;
          font-size: 12px;
        }

        .print-geladeira-icon {
          font-size: 14px;
        }

        .print-receita {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 15px;
          margin-bottom: 15px;
          font-size: 12px;
        }

        .print-checkbox {
          width: 14px;
          height: 14px;
          border: 2px solid #000;
          display: inline-block;
        }

        .print-valor-box {
          background-color: #FFFDE7;
          border: 2px solid #FBC02D;
          padding: 15px;
          margin-bottom: 20px;
          text-align: center;
          font-size: 18px;
          font-weight: bold;
        }

        .print-valor-icon {
          margin-right: 10px;
        }

        .print-footer {
          text-align: center;
          font-size: 10px;
          color: #666;
          padding-top: 15px;
          border-top: 1px solid #ddd;
        }

        .print-footer div {
          margin-bottom: 3px;
        }
      `}</style>

      <div className="print-page">
        {/* Header */}
        <div className="print-header-top">
          <span>{dataHoraHeader}</span>
          <span>Formedica Entregas</span>
        </div>

        {/* Logo */}
        <div className="print-logo">
          <div className="print-logo-box">F</div>
          <span className="print-logo-text">Formedica Entregas</span>
        </div>

        {/* Titulo */}
        <div className="print-title">
          <h1>ROMANEIO DE ENTREGA</h1>
          <p>Sistema de Gestao de Entregas</p>
        </div>

        {/* Info Principal */}
        <div className="print-box">
          <div className="print-row">
            <span className="print-label">N. REQUISICAO:</span>
            <span className="print-value-bold"># {romaneio.requisicao || '0000'}</span>
          </div>
          <div className="print-row">
            <span className="print-label">ENTREGA DE DADOS:</span>
            <span className="print-value">{formatarData(romaneio.data_entrega)} - {romaneio.periodo || '-'}</span>
          </div>
          <div className="print-row">
            <span className="print-label">STATUS:</span>
            <span className="print-value">{romaneio.status || '-'}</span>
          </div>
        </div>

        {/* Cliente e Responsaveis */}
        <div className="print-grid">
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

          <div className="print-grid-col">
            <div className="print-section-title">RESPONSAVEIS</div>
            <div className="print-section-row">
              <span className="print-section-label">Convidado:</span>
              <span className="print-section-value">{romaneio.atendente?.email || romaneio.atendente?.nome || '-'}</span>
            </div>
            <div className="print-section-row">
              <span className="print-section-label">Motoboy:</span>
              <span className="print-section-value">{romaneio.motoboy?.nome || '-'}</span>
            </div>
          </div>
        </div>

        {/* Endereco */}
        <div className="print-endereco">
          <div className="print-endereco-title">ENDERECO DE ENTREGA</div>
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

        {/* Pagamento */}
        <div className="print-pagamento">
          <div className="print-pagamento-title">PAGAMENTO</div>
          <div className="print-pagamento-row">
            <span className="print-pagamento-label">Forma:</span>
            <span className="print-pagamento-value">{romaneio.forma_pagamento || '-'}</span>
          </div>
        </div>

        {/* Item Geladeira */}
        {romaneio.item_geladeira && (
          <div className="print-geladeira">
            <span className="print-geladeira-icon">⚙</span>
            <span>ITEM DE GELADEIRA - MANTER REFRIGERADO</span>
          </div>
        )}

        {/* Buscar Receita */}
        {romaneio.buscar_receita && (
          <div className="print-receita">
            <span className="print-checkbox"></span>
            <span>BUSCAR RECEITA</span>
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
          <div>Codigo de Rastreamento: {romaneio.codigo_rastreio || '-'}</div>
          <div>Impressao em: {dataImpressao}</div>
        </div>
      </div>
    </div>
  );
}
