import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UsuarioCarona {
  nome: string;
  email: string;
}

export interface Carona {
  id: number;
  nome: string;
  origem: string;
  destino: string;
  horario: string;
  vagas: number;
  linkMapa: string;
  motoristaEmail?: string;
  passageiros: UsuarioCarona[];
}

export type NovaCarona = Omit<Carona, 'id' | 'passageiros'> & {
  passageiros?: UsuarioCarona[];
};

export interface ResultadoCarona {
  sucesso: boolean;
  mensagem: string;
  carona?: Carona;
}

@Injectable({
  providedIn: 'root'
})
export class CaronaService {

  private caronas: Carona[] = [];
  private caronasSubject = new BehaviorSubject<Carona[]>([]);
  private idCounter = 1;
  private storageKey = 'caronas_disponiveis';

  constructor() {
    this.carregarStorage();
    this.emitirCaronas();
  }

  adicionar(carona: NovaCarona) {
    this.caronas.push({
      id: this.idCounter++,
      ...carona,
      nome: carona.nome.trim(),
      origem: carona.origem.trim(),
      destino: carona.destino.trim(),
      horario: carona.horario,
      linkMapa: (carona.linkMapa ?? '').trim(),
      motoristaEmail: this.normalizarEmail(carona.motoristaEmail),
      passageiros: this.normalizarPassageiros(carona.passageiros)
    });
    this.salvarStorage();
    this.emitirCaronas();
  }

  listar(): Carona[] {
    return [...this.caronas];
  }

  getCaronas(): Observable<Carona[]> {
    return this.caronasSubject.asObservable();
  }

  buscarPorId(id: number): Carona | undefined {
    return this.caronas.find(c => c.id === id);
  }

  ehMotoristaDaCarona(carona: Carona, usuario: UsuarioCarona): boolean {
    return this.usuarioEhMotorista(carona, usuario);
  }

  ehPassageiroDaCarona(carona: Carona, usuario: UsuarioCarona): boolean {
    const emailNormalizado = this.normalizarEmail(usuario.email);
    if (!emailNormalizado) {
      return false;
    }

    return carona.passageiros.some(
      passageiro => this.normalizarEmail(passageiro.email) === emailNormalizado
    );
  }

  sincronizarUsuario(usuarioAnterior: UsuarioCarona, usuarioAtualizado: UsuarioCarona): void {
    const emailAnterior = this.normalizarEmail(usuarioAnterior.email);
    const nomeAnterior = this.normalizarTexto(usuarioAnterior.nome);
    const emailAtualizado = this.normalizarEmail(usuarioAtualizado.email);

    this.caronas = this.caronas.map(carona => {
      const motoristaPorEmail = !!emailAnterior && this.normalizarEmail(carona.motoristaEmail) === emailAnterior;
      const motoristaSemEmail = !carona.motoristaEmail && this.normalizarTexto(carona.nome) === nomeAnterior;
      let passageiroAtualizado = false;

      const passageiros = carona.passageiros.map(passageiro => {
        const passageiroEhUsuario = !!emailAnterior && this.normalizarEmail(passageiro.email) === emailAnterior;
        if (!passageiroEhUsuario) {
          return passageiro;
        }

        passageiroAtualizado = true;
        return {
          nome: usuarioAtualizado.nome.trim(),
          email: emailAtualizado || passageiro.email
        };
      });

      if (!motoristaPorEmail && !motoristaSemEmail && !passageiroAtualizado) {
        return carona;
      }

      return {
        ...carona,
        nome: motoristaPorEmail || motoristaSemEmail ? usuarioAtualizado.nome.trim() : carona.nome,
        motoristaEmail: motoristaPorEmail || motoristaSemEmail ? emailAtualizado : carona.motoristaEmail,
        passageiros
      };
    });

    this.salvarStorage();
    this.emitirCaronas();
  }

  listarComoMotorista(usuario: UsuarioCarona): Carona[] {
    return this.caronas.filter(carona => this.usuarioEhMotorista(carona, usuario));
  }

  listarComoPassageiro(usuario: UsuarioCarona): Carona[] {
    const emailNormalizado = this.normalizarEmail(usuario.email);
    if (!emailNormalizado) {
      return [];
    }

    return this.caronas.filter(carona =>
      carona.passageiros.some(passageiro => this.normalizarEmail(passageiro.email) === emailNormalizado)
    );
  }

  pegarCarona(id: number, passageiro: UsuarioCarona): ResultadoCarona {
    const carona = this.buscarPorId(id);

    if (!carona) {
      return { sucesso: false, mensagem: 'Carona nao encontrada.' };
    }

    if (this.usuarioEhMotorista(carona, passageiro)) {
      return { sucesso: false, mensagem: 'Voce ja e o motorista desta carona.', carona };
    }

    const emailNormalizado = this.normalizarEmail(passageiro.email);
    if (!emailNormalizado) {
      return { sucesso: false, mensagem: 'Faca login para entrar em uma carona.', carona };
    }

    const jaParticipa = carona.passageiros.some(
      participante => this.normalizarEmail(participante.email) === emailNormalizado
    );

    if (jaParticipa) {
      return { sucesso: false, mensagem: 'Voce ja entrou nessa carona.', carona };
    }

    if (carona.vagas <= 0) {
      return { sucesso: false, mensagem: 'Nao ha mais vagas disponiveis.', carona };
    }

    carona.passageiros.push({
      nome: passageiro.nome.trim(),
      email: emailNormalizado
    });
    carona.vagas--;

    this.salvarStorage();
    this.emitirCaronas();

    return {
      sucesso: true,
      mensagem: 'Carona confirmada! Ela ja aparece em Minhas Caronas.',
      carona
    };
  }

  atualizarCarona(id: number, dados: NovaCarona, usuario: UsuarioCarona): ResultadoCarona {
    const carona = this.buscarPorId(id);

    if (!carona) {
      return { sucesso: false, mensagem: 'Carona nao encontrada.' };
    }

    if (!this.usuarioEhMotorista(carona, usuario)) {
      return { sucesso: false, mensagem: 'Apenas o motorista pode editar essa carona.', carona };
    }

    carona.nome = dados.nome.trim();
    carona.origem = dados.origem.trim();
    carona.destino = dados.destino.trim();
    carona.horario = dados.horario;
    carona.vagas = Number(dados.vagas);
    carona.linkMapa = (dados.linkMapa ?? '').trim();
    carona.motoristaEmail = this.normalizarEmail(dados.motoristaEmail) ?? carona.motoristaEmail;

    this.salvarStorage();
    this.emitirCaronas();

    return {
      sucesso: true,
      mensagem: 'Carona atualizada com sucesso.',
      carona
    };
  }

  excluirCarona(id: number, usuario: UsuarioCarona): ResultadoCarona {
    const carona = this.buscarPorId(id);

    if (!carona) {
      return { sucesso: false, mensagem: 'Carona nao encontrada.' };
    }

    if (!this.usuarioEhMotorista(carona, usuario)) {
      return { sucesso: false, mensagem: 'Apenas o motorista pode excluir essa carona.', carona };
    }

    this.caronas = this.caronas.filter(c => c.id !== id);
    this.salvarStorage();
    this.emitirCaronas();

    return {
      sucesso: true,
      mensagem: 'Carona excluida com sucesso.'
    };
  }

  cancelarParticipacao(id: number, passageiro: UsuarioCarona): ResultadoCarona {
    const carona = this.buscarPorId(id);

    if (!carona) {
      return { sucesso: false, mensagem: 'Carona nao encontrada.' };
    }

    const emailNormalizado = this.normalizarEmail(passageiro.email);
    if (!emailNormalizado) {
      return { sucesso: false, mensagem: 'Faca login para cancelar a carona.', carona };
    }

    const totalAntes = carona.passageiros.length;
    carona.passageiros = carona.passageiros.filter(
      participante => this.normalizarEmail(participante.email) !== emailNormalizado
    );

    if (carona.passageiros.length === totalAntes) {
      return { sucesso: false, mensagem: 'Voce nao esta nessa carona.', carona };
    }

    carona.vagas++;
    this.salvarStorage();
    this.emitirCaronas();

    return {
      sucesso: true,
      mensagem: 'Sua participacao na carona foi cancelada.',
      carona
    };
  }

  cancelarCarona(id: number) {
    this.caronas = this.caronas.filter(c => c.id !== id);
    this.salvarStorage();
    this.emitirCaronas();
  }

  salvarFavorita(carona: Carona) {
    const chaveSalvas = 'caronas_salvas';
    const caronasSalvas = this.carregarCaronasSalvas();
    if (!caronasSalvas.some(c => c.id === carona.id)) {
      caronasSalvas.push(carona);
      localStorage.setItem(chaveSalvas, JSON.stringify(caronasSalvas));
    }
  }

  private carregarCaronasSalvas(): Carona[] {
    const valor = localStorage.getItem('caronas_salvas');
    if (!valor) {
      return [];
    }
    try {
      return (JSON.parse(valor) as Carona[]).map(carona => this.normalizarCarona(carona));
    } catch {
      return [];
    }
  }

  private salvarStorage() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.caronas));
  }

  private carregarStorage() {
    const valor = localStorage.getItem(this.storageKey);
    if (valor) {
      try {
        this.caronas = (JSON.parse(valor) as Carona[]).map(carona => this.normalizarCarona(carona));
        const maiorId = this.caronas.reduce((max, carona) => Math.max(max, carona.id), 0);
        this.idCounter = maiorId + 1;
      } catch {
        this.caronas = [];
        this.idCounter = 1;
      }
    }
  }

  private emitirCaronas() {
    this.caronasSubject.next([...this.caronas]);
  }

  private normalizarCarona(carona: Carona): Carona {
    return {
      ...carona,
      nome: (carona.nome ?? '').trim(),
      origem: (carona.origem ?? '').trim(),
      destino: (carona.destino ?? '').trim(),
      horario: carona.horario ?? '',
      vagas: Number(carona.vagas ?? 0),
      linkMapa: (carona.linkMapa ?? '').trim(),
      motoristaEmail: this.normalizarEmail(carona.motoristaEmail),
      passageiros: this.normalizarPassageiros(carona.passageiros)
    };
  }

  private normalizarPassageiros(passageiros?: UsuarioCarona[]): UsuarioCarona[] {
    if (!Array.isArray(passageiros)) {
      return [];
    }

    return passageiros.reduce<UsuarioCarona[]>((acumulado, passageiro) => {
      const email = this.normalizarEmail(passageiro?.email);
      if (!email) {
        return acumulado;
      }

      acumulado.push({
        nome: (passageiro?.nome ?? '').trim(),
        email
      });

      return acumulado;
    }, []);
  }

  private usuarioEhMotorista(carona: Carona, usuario: UsuarioCarona): boolean {
    const emailUsuario = this.normalizarEmail(usuario.email);
    const emailMotorista = this.normalizarEmail(carona.motoristaEmail);
    const nomeUsuario = this.normalizarTexto(usuario.nome);
    const nomeMotorista = this.normalizarTexto(carona.nome);

    if (emailUsuario && emailMotorista) {
      return emailUsuario === emailMotorista;
    }

    return !!nomeUsuario && nomeUsuario === nomeMotorista;
  }

  private normalizarEmail(email?: string): string | undefined {
    const valor = (email ?? '').trim().toLowerCase();
    return valor || undefined;
  }

  private normalizarTexto(valor?: string): string {
    return (valor ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  }
}
