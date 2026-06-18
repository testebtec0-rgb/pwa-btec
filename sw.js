function doGet(e) {
  var params = e.parameter;
  var prefixo = params.prefixo || "BTEC-GERAL";
  var familia = params.familia || "TRANSPORTE";
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Ler as configurações dos campos dinâmicos (Aba com nova estrutura)
  var sheetConfig = ss.getSheetByName("CONFIGURACAO_CAMPOS");
  var dataConfig = sheetConfig.getDataRange().getValues();
  
  var camposDinamicos = [];
  
  // Pula a linha 0 (cabeçalho) e percorre as configurações
  for (var i = 1; i < dataConfig.length; i++) {
    var campoId      = dataConfig[i][0]; // Coluna A (CAMPO)
    var label        = dataConfig[i][1]; // Coluna B (LABEL_EXIBICAO)
    var tipo         = dataConfig[i][2]; // Coluna C (TIPO)
    var obrigatorio  = dataConfig[i][3]; // Coluna D (OBRIGATORIO)
    var familiasAtiv = dataConfig[i][4]; // Coluna E (FAMILIAS_ATIVAS)
    var opcoesStr    = dataConfig[i][5]; // Coluna F (OPCOES_SELECAO)
    var valorPadrao  = dataConfig[i][6]; // Coluna G (VALOR_PADRAO)
    
    if (!campoId) continue;
    
    // Verifica se o campo é global (vazio) ou específico para a família atual do QR Code
    var mostrarCampo = false;
    if (!familiasAtiv || familiasAtiv.toString().trim() === "") {
      mostrarCampo = true;
    } else {
      var listaFamilias = familiasAtiv.toString().split(",").map(function(f) { return f.trim().toUpperCase(); });
      if (listaFamilias.indexOf(familia.toUpperCase()) !== -1) {
        mostrarCampo = true;
      }
    }
    
    if (mostrarCampo) {
      var opcoesArray = [];
      if (opcoesStr && tipo.toString().toLowerCase() === "select") {
        opcoesArray = opcoesStr.toString().split(",").map(function(o) { return o.trim(); });
      }
      
      camposDinamicos.push({
        id: campoId,
        label: label,
        tipo: tipo.toString().toLowerCase(),
        obrigatorio: (obrigatorio.toString().toUpperCase() === "SIM"),
        opcoes: opcoesArray,
        valorPadrao: valorPadrao
      });
    }
  }
  
  // 2. Retorna o pacote de dados estruturado para o app.js
  var resposta = {
    prefixo: prefixo,
    familia: familia,
    campos: camposDinamicos
  };
  
  return ContentService.createTextOutput(JSON.stringify(resposta))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var dados = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetRegistros = ss.getSheetByName("REGISTROS_OPERACAO");
    
    // Cria o cabeçalho dinamicamente na primeira linha caso a aba esteja vazia
    if (sheetRegistros.getLastRow() === 0) {
      sheetRegistros.appendRow(["Data/Hora", "Prefixo", "Família", "Respostas JSON"]);
    }
    
    // Salva o registro enviado pelo operador
    sheetRegistros.appendRow([
      new Date(),
      dados.prefixo,
      dados.familia,
      JSON.stringify(dados.respostas)
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "SUCESSO" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(erro) {
    return ContentService.createTextOutput(JSON.stringify({ status: "ERRO", motivo: erro.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
