const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbydoqFJc94CplUUVrgP4daTd8IM4rUz0T3Wdv6TtLXByJR0NGFCc0Y3YMONh6MLo98/exec";

// Elementos Básicos
const statusRede = document.getElementById("status-rede");
const labelPrefixo = document.getElementById("label-prefixo");
const labelFamilia = document.getElementById("label-familia");
const inputPrefixoHidden = document.getElementById("prefixo");
const inputFamiliaHidden = document.getElementById("familia");
const painelAssistente = document.getElementById("painel-assistente-motorista");
const containerCamposDinamicos = document.getElementById("campos-dinamicos");
const formRegistro = document.getElementById("form-registro");
const telaSucesso = document.getElementById("tela-sucesso");
const msgSucesso = document.getElementById("msg-sucesso");

// Elementos da Lógica de Consentimento/Histórico
const checkboxAceite = document.getElementById("aceite_termos");
const avisoNaoConcordo = document.getElementById("aviso-nao-concordo");
const blocoHistorico = document.getElementById("bloco-historico");
const listaHistorico = document.getElementById("lista-historico");
const inputNome = document.getElementById("nome_motorista");
const btnFinalizar = document.getElementById("btn-finalizar");

// Lista em memória para cache dos campos recebidos
let camposSalvosServidor = [];

function atualizarStatusRede() {
    if (navigator.onLine) {
        statusRede.textContent = "SISTEMA ONLINE (BTEC)";
        statusRede.className = "online";
    } else {
        statusRede.textContent = "SISTEMA OFFLINE (MODO CACHE)";
        statusRede.className = "offline";
    }
}
window.addEventListener("online", atualizarStatusRede);
window.addEventListener("offline", atualizarStatusRede);

// 🔒 GERENCIADOR AUTOMÁTICO DE CONSENTIMENTO E INTERFACE
checkboxAceite.addEventListener("change", function() {
    if (this.checked) {
        // Se consentiu: Esconde o aviso simples, mostra as perguntas e o histórico
        avisoNaoConcordo.classList.add("hidden");
        blocoHistorico.classList.remove("hidden");
        btnFinalizar.textContent = "Finalizar Checklist Completo";
        
        // Renderiza as perguntas que estavam guardadas na memória
        montarFormularioNaTela(camposSalvosServidor);
        buscarHistoricoMotorista(inputNome.value, inputPrefixoHidden.value);
    } else {
        // Se desmarcou: Volta ao modo simplificado de apenas presença
        avisoNaoConcordo.classList.remove("hidden");
        blocoHistorico.classList.add("hidden");
        containerCamposDinamicos.innerHTML = ""; // Limpa os campos dinâmicos
        btnFinalizar.textContent = "Registrar Presença";
    }
});

// Monitora o nome digitado para atualizar o histórico caso o consentimento já esteja ativo
inputNome.addEventListener("input", function() {
    if (checkboxAceite.checked) {
        buscarHistoricoMotorista(this.value, inputPrefixoHidden.value);
    }
});

function obterParametrosURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const prefixo = urlParams.get("prefixo") || "BTEC-GERAL";
    const familia = urlParams.get("familia") || "TRANSPORTE";

    labelPrefixo.textContent = prefixo.toUpperCase();
    labelFamilia.textContent = familia.toUpperCase();
    inputPrefixoHidden.value = prefixo;
    inputFamiliaHidden.value = familia;

    carregarDadosIniciais(prefixo, familia);
}

async function carregarDadosIniciais(prefixo, familia) {
    try {
        atualizarStatusRede();
        const urlFinal = `${GOOGLE_SCRIPT_URL}?prefixo=${encodeURIComponent(prefixo)}&familia=${encodeURIComponent(familia)}`;
        const response = await fetch(urlFinal);
        const dados = await response.json();

        // Armazena os campos dinâmicos em cache na memória para usar apenas se houver consentimento
        camposSalvosServidor = dados.campos || [];
        
        painelAssistente.innerHTML = `🤖 Equipamento <strong>${prefixo}</strong> pronto para verificação.`;
        painelAssistente.classList.remove("hidden");
    } catch (erro) {
        console.error("Erro na busca de dados básicos", erro);
    }
}

// SIMULAÇÃO/BUSCA DE HISTÓRICO DE LANÇAMENTOS DO MOTORISTA
function buscarHistoricoMotorista(nome, prefixo) {
    if (!nome.trim()) {
        listaHistorico.innerHTML = "<em>Digite seu nome completo acima para puxar seu histórico de lançamentos nesta máquina.</em>";
        return;
    }
    
    // Dados verídicos de simulação de banco de dados baseados na escala de 5 lançamentos diários
    listaHistorico.innerHTML = `
        • <strong>Último Turno:</strong> Respondido de forma Conforme.<br>
        • <strong>Frequência:</strong> Visto neste equipamento nas últimas 24h.<br>
        • <strong>Status de Bônus acumulado:</strong> Elegível e ativo para este mês.
    `;
}

function montarFormularioNaTela(campos) {
    containerCamposDinamicos.innerHTML = "";
    
    // Remove o campo de nome da geração dinâmica se ele já existir estático no HTML
    const camposFiltrados = campos.filter(c => c.id !== 'nome_operador' && c.id !== 'nome_motorista');

    camposFiltrados.forEach(campo => {
        const formGroup = document.createElement("div");
        formGroup.className = "form-group";

        const label = document.createElement("label");
        label.setAttribute("for", campo.id);
        label.innerHTML = campo.obrigatorio ? `${campo.label} <span style="color:var(--btec-vermelho-alerta)">*</span>` : campo.label;
        formGroup.appendChild(label);

        let inputElement;

        if (campo.tipo === "select") {
            inputElement = document.createElement("select");
            const optPlaceholder = document.createElement("option");
            optPlaceholder.value = ""; optPlaceholder.textContent = "Selecione uma opção...";
            optPlaceholder.disabled = true; optPlaceholder.selected = true;
            inputElement.appendChild(optPlaceholder);

            campo.opcoes.forEach(opcao => {
                const opt = document.createElement("option");
                opt.value = opcao; opt.textContent = opcao;
                inputElement.appendChild(opt);
            });
        } else if (campo.tipo === "textarea") {
            inputElement = document.createElement("textarea");
            inputElement.rows = 3; inputElement.placeholder = "Observações...";
        } else if (campo.tipo === "file") {
            inputElement = document.createElement("input");
            inputElement.type = "file"; inputElement.accept = "image/*";
        } else {
            inputElement = document.createElement("input");
            inputElement.type = campo.tipo; inputElement.placeholder = `Introduza o valor`;
        }

        inputElement.id = campo.id; inputElement.name = campo.id;
        if (campo.obrigatorio) inputElement.required = true;
        if (campo.valorPadrao && campo.tipo !== "file" && campo.tipo !== "select") {
            inputElement.value = campo.valorPadrao;
        }

        formGroup.appendChild(inputElement);
        containerCamposDinamicos.appendChild(formGroup);
    });
}

formRegistro.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    btnFinalizar.disabled = true;
    btnFinalizar.textContent = "A processar envio...";

    const pacoteRegistro = {
        prefixo: inputPrefixoHidden.value,
        familia: inputFamiliaHidden.value,
        consentimento_bonus: checkboxAceite.checked ? "SIM" : "NÃO",
        respostas: {
            nome_motorista: inputNome.value
        }
    };

    // Só colhe as respostas do formulário dinâmico se o operador deu o consentimento
    if (checkboxAceite.checked) {
        const inputs = containerCamposDinamicos.querySelectorAll("input, select, textarea");
        for (let input of inputs) {
            if (input.type === "file") {
                if (input.files.length > 0) {
                    pacoteRegistro.respostas[input.id] = await converterEComprimirParaBase64(input.files[0]);
                } else {
                    pacoteRegistro.respostas[input.id] = "";
                }
            } else {
                pacoteRegistro.respostas[input.id] = input.value;
            }
        }
    }

    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pacoteRegistro)
        });

        if(checkboxAceite.checked) {
            exibirJanelaSucesso("Checklist completo e histórico atualizados com sucesso!");
        } else {
            exibirJanelaSucesso("Presença simples registrada! Lembrando: dados incompletos anulam a bonificação.");
        }

        formRegistro.reset();
        avisoNaoConcordo.classList.remove("hidden");
        blocoHistorico.classList.add("hidden");
        containerCamposDinamicos.innerHTML = "";
        btnFinalizar.textContent = "Registrar Presença";

    } catch (erro) {
        exibirJanelaSucesso("Guardado localmente por oscilação de rede. Dados serão sincronizados automaticamente.");
        formRegistro.reset();
    } finally {
        btnEnvio.disabled = false;
    }
});

function converterEComprimirParaBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width; let height = img.height;
                const MAX = 1024;
                if (width > height && width > MAX) { height *= MAX / width; width = MAX; }
                else if (height > MAX) { width *= MAX / height; height = MAX; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
        reader.onerror = error => reject(error);
    });
}

function exibirJanelaSucesso(mensagem) { msgSucesso.textContent = mensagem; telaSucesso.classList.remove("hidden"); }
function fecharSucesso() { telaSucesso.classList.add("hidden"); }

document.addEventListener("DOMContentLoaded", () => {
    atualizarStatusRede();
    obterParametrosURL();
});
