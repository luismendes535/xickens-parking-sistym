// parking.ts
import { createInterface } from 'readline';
    
// Types
type TipoVeiculo = "MOTO" | "CARRO" | "CARRO_GRANDE";

interface Veiculo {
  matricula: string;
  tipoVeiculo: TipoVeiculo;
  horaEntrada: Date | null;
}

type TipoCliente = "INDIVIDUAL" | "EMPRESA";

interface Cliente {
  id: number;
  nome: string;
  morada: string;
  telefone: string;
  email: string;
  tipo: TipoCliente;
  veiculos: Veiculo[];
}

interface LugarEstacionamento {
  id: number;
  tipo: TipoVeiculo;
  ocupado: boolean;
  cliente: Cliente | null;
  veiculo: Veiculo | null;
  horaEntrada: Date | null;
}

interface Sistema {
  totalLugares: number;
  totalPisos: number;
  lugares: LugarEstacionamento[][];
  clientes: Cliente[];
  precos: {
    primeiros15min: number;
    primeiros30min: number;
    primeiraHora: number;
    horasAdicionais: number;
    diaCompleto: number;
  };
}

// Global variable for the system
const sistema: Sistema = {
  totalLugares: 0,
  totalPisos: 0,
  lugares: [],
  clientes: [],
  precos: {
    primeiros15min: 1,
    primeiros30min: 2,
    primeiraHora: 3,
    horasAdicionais: 2,
    diaCompleto: 20,
  },
};

// Functions
function inicializarSistema(pisos: number, lugaresPorPiso: number): void {
  if (pisos > 5 || lugaresPorPiso > 200) {
    console.error("Número máximo de pisos ou lugares excedido!");
    return;
  }
  sistema.totalPisos = pisos;
  sistema.totalLugares = lugaresPorPiso;

  sistema.lugares = Array.from({ length: pisos }, (_, pisoIndex) =>
    Array.from({ length: lugaresPorPiso }, (_, lugarIndex) => ({
      id: pisoIndex * lugaresPorPiso + lugarIndex + 1,
      tipo: "CARRO" as TipoVeiculo,
      ocupado: false,
      cliente: null,
      veiculo: null,
      horaEntrada: null,
    }))
  );

  console.log(`Sistema inicializado com ${pisos} pisos e ${lugaresPorPiso} lugares por piso.`);
}

function definirPrecos(precos: Partial<Sistema["precos"]>): void {
  sistema.precos = { ...sistema.precos, ...precos };
  console.log("Preços atualizados:", sistema.precos);
}

function registrarCliente(cliente: Cliente): void {
  if (sistema.clientes.some((c) => c.id === cliente.id)) {
    console.error("Cliente já registrado com este ID!");
    return;
  }
  sistema.clientes.push(cliente);
  console.log(`Cliente ${cliente.nome} registrado com sucesso.`);
}

function registrarEntradaVeiculo(matricula: string, tipo: TipoVeiculo, clienteId?: number): void {
  const lugarLivre = sistema.lugares.flat().find((lugar) => !lugar.ocupado && lugar.tipo === tipo);
  if (!lugarLivre) {
    console.error("Nenhum lugar disponível para este tipo de veículo.");
    return;
  }

  const cliente = clienteId ? sistema.clientes.find((c) => c.id === clienteId) : null;

  lugarLivre.ocupado = true;
  lugarLivre.cliente = cliente || null;
  lugarLivre.veiculo = { matricula, tipoVeiculo: tipo, horaEntrada: new Date() };
  lugarLivre.horaEntrada = new Date();

  console.log(`Veículo ${matricula} estacionado no lugar ${lugarLivre.id}.`);
}

function registrarSaidaVeiculo(matricula: string): void {
  const lugar = sistema.lugares.flat().find(
    (lugar) => lugar.ocupado && lugar.veiculo?.matricula === matricula
  );
  if (!lugar) {
    console.error("Veículo não encontrado.");
    return;
  }

  const tempoEstacionado = (new Date().getTime() - lugar.horaEntrada!.getTime()) / (1000 * 60); // Em minutos
  const custo = calcularCusto(tempoEstacionado);

  console.log(`Custo para o veículo ${matricula}: €${custo.toFixed(2)}`);
  lugar.ocupado = false;
  lugar.cliente = null;
  lugar.veiculo = null;
  lugar.horaEntrada = null;
}

function calcularCusto(tempoEstacionado: number): number {
  if (tempoEstacionado <= 15) return sistema.precos.primeiros15min;
  if (tempoEstacionado <= 30) return sistema.precos.primeiros30min;
  if (tempoEstacionado <= 60) return sistema.precos.primeiraHora;

  const horasAdicionais = Math.ceil((tempoEstacionado - 60) / 60);
  return sistema.precos.primeiraHora + horasAdicionais * sistema.precos.horasAdicionais;
}

function consultarOcupacao(): void {
  const ocupados = sistema.lugares.flat().filter((lugar) => lugar.ocupado).length;
  const total = sistema.lugares.flat().length;
  console.log(`Ocupação: ${ocupados}/${total}`);
}

function listarClientes(): void {
  sistema.clientes.forEach((cliente) => {
    console.log(`ID: ${cliente.id}, Nome: ${cliente.nome}, Veículos: ${cliente.veiculos.length}`);
  });
}

// CLI Interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function mainMenu() {
  while (true) {
    console.log('\n=== Sistema de Estacionamento ===');
    console.log('1. Inicializar Sistema');
    console.log('2. Definir Preços');
    console.log('3. Registrar Cliente');
    console.log('4. Registrar Entrada de Veículo');
    console.log('5. Registrar Saída de Veículo');
    console.log('6. Consultar Ocupação');
    console.log('7. Listar Clientes');
    console.log('8. Sair');

    const opcao = await prompt('Escolha uma opção: ');

    switch (opcao) {
      case '1':
        const pisos = parseInt(await prompt('Número de pisos: '));
        const lugares = parseInt(await prompt('Lugares por piso: '));
        inicializarSistema(pisos, lugares);
        break;

      case '2':
        const precos = {
          primeiros15min: parseFloat(await prompt('Preço primeiros 15 min: ')),
          primeiros30min: parseFloat(await prompt('Preço primeiros 30 min: ')),
          primeiraHora: parseFloat(await prompt('Preço primeira hora: ')),
          horasAdicionais: parseFloat(await prompt('Preço horas adicionais: ')),
          diaCompleto: parseFloat(await prompt('Preço dia completo: '))
        };
        definirPrecos(precos);
        break;

      case '3':
        const cliente = {
          id: parseInt(await prompt('ID do cliente: ')),
          nome: await prompt('Nome: '),
          morada: await prompt('Morada: '),
          telefone: await prompt('Telefone: '),
          email: await prompt('Email: '),
          tipo: (await prompt('Tipo (INDIVIDUAL/EMPRESA): ')) as TipoCliente,
          veiculos: []
        };
        registrarCliente(cliente);
        break;

      case '4':
        const matricula = await prompt('Matrícula: ');
        const tipo = await prompt('Tipo (MOTO/CARRO/CARRO_GRANDE): ') as TipoVeiculo;
        const clienteId = parseInt(await prompt('ID do cliente (opcional, pressione Enter para pular): '));
        registrarEntradaVeiculo(matricula, tipo, clienteId || undefined);
        break;

      case '5':
        const matriculaSaida = await prompt('Matrícula: ');
        registrarSaidaVeiculo(matriculaSaida);
        break;

      case '6':
        consultarOcupacao();
        break;

      case '7':
        listarClientes();
        break;

      case '8':
        console.log('Encerrando...');
        rl.close();
        return;

      default:
        console.log('Opção inválida!');
    }
  }
}

// Start the application
mainMenu().catch(console.error);
