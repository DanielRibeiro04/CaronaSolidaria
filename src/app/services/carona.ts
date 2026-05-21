import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { firebaseDb } from '../firebase.config';
import { UsuarioService } from './usuario';

export interface UsuarioCarona {
  nome: string;
  email: string;
}

export interface Carona {
  id: string;
  nome: string;
  origem: string;
  destino: string;
  horario: string;
  vagas: number;
  linkMapa: string;
  motoristaEmail?: string;
  passageiros: UsuarioCarona[];
  criadoEm: string;
  data: string;
}

export type NovaCarona = Omit<Carona, 'id' | 'passageiros' | 'criadoEm'> & {
  passageiros?: UsuarioCarona[];
};

export interface ResultadoCarona {
  sucesso: boolean;
  mensagem: string;
  carona?: Carona;
}

@Injectable({
  providedIn: 'root',
})
export class CaronaService {
  private caronas: Carona[] = [];
  private caronasSubject = new BehaviorSubject<Carona[]>([]);
  private caronasCollection = 'caronas';
  private caronasSalvasCollection = 'caronas_salvas';

  constructor(private usuarioService: UsuarioService) {
    this.carregarCaronasRealtime();
  }

  async adicionar(carona: NovaCarona) {
    const novaCarona: Omit<Carona, 'id'> = {
      nome: carona.nome.trim(),
      origem: carona.origem.trim(),
      destino: carona.destino.trim(),
      horario: carona.horario,
      data: carona.data,
      linkMapa: (carona.linkMapa ?? '').trim(),
      motoristaEmail: this.normalizarEmail(carona.motoristaEmail),
      passageiros: this.normalizarPassageiros(carona.passageiros),
      vagas: carona.vagas,
      criadoEm: new Date().toISOString(),
    };
    if (navigator.onLine) {
      await addDoc(collection(firebaseDb, this.caronasCollection), novaCarona);
    } else {
      const pendentes = JSON.parse(
        localStorage.getItem('caronas-pendentes') || '[]',
      );

      pendentes.push(novaCarona);

      localStorage.setItem('caronas-pendentes', JSON.stringify(pendentes));

      alert('Sem internet. A carona será enviada automaticamente.');
    }
  }

  listar(): Carona[] {
    return [...this.caronas];
  }

  getCaronas(): Observable<Carona[]> {
    return this.caronasSubject.asObservable();
  }

  buscarPorId(id: string): Carona | undefined {
    return this.caronas.find((c) => c.id === id);
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
      (passageiro) =>
        this.normalizarEmail(passageiro.email) === emailNormalizado,
    );
  }

  sincronizarUsuario(
    usuarioAnterior: UsuarioCarona,
    usuarioAtualizado: UsuarioCarona,
  ): void {
    const emailAnterior = this.normalizarEmail(usuarioAnterior.email);
    const nomeAnterior = this.normalizarTexto(usuarioAnterior.nome);
    const emailAtualizado = this.normalizarEmail(usuarioAtualizado.email);

    this.caronas.forEach(async (carona) => {
      const motoristaPorEmail =
        !!emailAnterior &&
        this.normalizarEmail(carona.motoristaEmail) === emailAnterior;
      const motoristaSemEmail =
        !carona.motoristaEmail &&
        this.normalizarTexto(carona.nome) === nomeAnterior;
      let passageiroAtualizado = false;

      const passageiros = carona.passageiros.map((passageiro) => {
        const passageiroEhUsuario =
          !!emailAnterior &&
          this.normalizarEmail(passageiro.email) === emailAnterior;
        if (!passageiroEhUsuario) {
          return passageiro;
        }

        passageiroAtualizado = true;
        return {
          nome: usuarioAtualizado.nome.trim(),
          email: emailAtualizado || passageiro.email,
        };
      });

      if (motoristaPorEmail || motoristaSemEmail || passageiroAtualizado) {
        const docRef = doc(firebaseDb, this.caronasCollection, carona.id);
        await updateDoc(docRef, {
          nome:
            motoristaPorEmail || motoristaSemEmail
              ? usuarioAtualizado.nome.trim()
              : carona.nome,
          motoristaEmail:
            motoristaPorEmail || motoristaSemEmail
              ? emailAtualizado
              : carona.motoristaEmail,
          passageiros,
        });
      }
    });
  }

  listarComoMotorista(usuario: UsuarioCarona): Carona[] {
    return this.caronas.filter((carona) =>
      this.usuarioEhMotorista(carona, usuario),
    );
  }

  listarComoPassageiro(usuario: UsuarioCarona): Carona[] {
    const emailNormalizado = this.normalizarEmail(usuario.email);
    if (!emailNormalizado) {
      return [];
    }

    return this.caronas.filter((carona) =>
      carona.passageiros.some(
        (passageiro) =>
          this.normalizarEmail(passageiro.email) === emailNormalizado,
      ),
    );
  }

  async pegarCarona(
    id: string,
    passageiro: UsuarioCarona,
  ): Promise<ResultadoCarona> {
    const carona = this.buscarPorId(id);

    if (!carona) {
      return { sucesso: false, mensagem: 'Carona não encontrada.' };
    }

    if (this.usuarioEhMotorista(carona, passageiro)) {
      return {
        sucesso: false,
        mensagem: 'Você já é o motorista desta carona.',
        carona,
      };
    }

    const emailNormalizado = this.normalizarEmail(passageiro.email);
    if (!emailNormalizado) {
      return {
        sucesso: false,
        mensagem: 'Faça login para entrar em uma carona.',
        carona,
      };
    }

    const jaParticipa = carona.passageiros.some(
      (participante) =>
        this.normalizarEmail(participante.email) === emailNormalizado,
    );

    if (jaParticipa) {
      return {
        sucesso: false,
        mensagem: 'Você já entrou nessa carona.',
        carona,
      };
    }

    if (carona.vagas <= 0) {
      return {
        sucesso: false,
        mensagem: 'Não há mais vagas disponíveis.',
        carona,
      };
    }

    const docRef = doc(firebaseDb, this.caronasCollection, id);
    const novosPassageiros = [
      ...carona.passageiros,
      {
        nome: passageiro.nome.trim(),
        email: emailNormalizado,
      },
    ];

    await updateDoc(docRef, {
      passageiros: novosPassageiros,
      vagas: carona.vagas - 1,
    });

    return {
      sucesso: true,
      mensagem: 'Carona confirmada! Ela já aparece em Minhas Caronas.',
      carona: {
        ...carona,
        passageiros: novosPassageiros,
        vagas: carona.vagas - 1,
      },
    };
  }

  async atualizarCarona(
    id: string,
    dados: NovaCarona,
    usuario: UsuarioCarona,
  ): Promise<ResultadoCarona> {
    const carona = this.buscarPorId(id);

    if (!carona) {
      return { sucesso: false, mensagem: 'Carona não encontrada.' };
    }

    if (!this.usuarioEhMotorista(carona, usuario)) {
      return {
        sucesso: false,
        mensagem: 'Apenas o motorista pode editar essa carona.',
        carona,
      };
    }

    const docRef = doc(firebaseDb, this.caronasCollection, id);
    await updateDoc(docRef, {
      nome: dados.nome.trim(),
      origem: dados.origem.trim(),
      destino: dados.destino.trim(),
      horario: dados.horario,
      data: dados.data,
      vagas: Number(dados.vagas),
      linkMapa: (dados.linkMapa ?? '').trim(),
      motoristaEmail:
        this.normalizarEmail(dados.motoristaEmail) ?? carona.motoristaEmail,
    });

    return {
      sucesso: true,
      mensagem: 'Carona atualizada com sucesso.',
      carona: { ...carona, ...dados },
    };
  }

  async excluirCarona(
    id: string,
    usuario: UsuarioCarona,
  ): Promise<ResultadoCarona> {
    const carona = this.buscarPorId(id);

    if (!carona) {
      return { sucesso: false, mensagem: 'Carona não encontrada.' };
    }

    if (!this.usuarioEhMotorista(carona, usuario)) {
      return {
        sucesso: false,
        mensagem: 'Apenas o motorista pode excluir essa carona.',
        carona,
      };
    }

    await deleteDoc(doc(firebaseDb, this.caronasCollection, id));

    return {
      sucesso: true,
      mensagem: 'Carona excluída com sucesso.',
    };
  }

  async cancelarParticipacao(
    id: string,
    passageiro: UsuarioCarona,
  ): Promise<ResultadoCarona> {
    const carona = this.buscarPorId(id);

    if (!carona) {
      return { sucesso: false, mensagem: 'Carona não encontrada.' };
    }

    const emailNormalizado = this.normalizarEmail(passageiro.email);
    if (!emailNormalizado) {
      return {
        sucesso: false,
        mensagem: 'Faça login para cancelar a carona.',
        carona,
      };
    }

    const novosPassageiros = carona.passageiros.filter(
      (participante) =>
        this.normalizarEmail(participante.email) !== emailNormalizado,
    );

    if (novosPassageiros.length === carona.passageiros.length) {
      return {
        sucesso: false,
        mensagem: 'Você não está nessa carona.',
        carona,
      };
    }

    const docRef = doc(firebaseDb, this.caronasCollection, id);
    await updateDoc(docRef, {
      passageiros: novosPassageiros,
      vagas: carona.vagas + 1,
    });

    return {
      sucesso: true,
      mensagem: 'Sua participação na carona foi cancelada.',
      carona: {
        ...carona,
        passageiros: novosPassageiros,
        vagas: carona.vagas + 1,
      },
    };
  }

  async salvarFavorita(carona: Carona): Promise<void> {
    const usuario = this.usuarioService.obterUsuarioAtual();
    if (!usuario?.id) {
      throw new Error('Faça login para salvar uma carona como favorita.');
    }

    const favoritasRef = collection(firebaseDb, this.caronasSalvasCollection);
    const q = query(
      favoritasRef,
      where('usuarioId', '==', usuario.id),
      where('caronaId', '==', carona.id),
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      await addDoc(favoritasRef, {
        usuarioId: usuario.id,
        caronaId: carona.id,
        salvoEm: new Date().toISOString(),
      });
    }
  }

  async carregarCaronasSalvas(): Promise<Carona[]> {
    const usuario = this.usuarioService.obterUsuarioAtual();
    if (!usuario?.id) {
      return [];
    }

    const favoritasRef = collection(firebaseDb, this.caronasSalvasCollection);
    const q = query(favoritasRef, where('usuarioId', '==', usuario.id));
    const querySnapshot = await getDocs(q);
    const idsSalvas = querySnapshot.docs.map(
      (doc) => (doc.data() as { caronaId: string }).caronaId,
    );

    return this.caronas.filter((carona) => idsSalvas.includes(carona.id));
  }

  private carregarCaronasRealtime() {
    const caronasRef = collection(firebaseDb, this.caronasCollection);
    const q = query(caronasRef, orderBy('criadoEm', 'desc'));

    onSnapshot(q, (querySnapshot) => {
      this.caronas = querySnapshot.docs
        .map((doc) => ({
          ...(doc.data() as Omit<Carona, 'id'>),
          id: doc.id,
        }))
        .map((carona) => this.normalizarCarona(carona));

      this.caronasSubject.next([...this.caronas]);
    });
  }

  private normalizarCarona(carona: Carona): Carona {
    return {
      ...carona,
      nome: (carona.nome ?? '').trim(),
      origem: (carona.origem ?? '').trim(),
      destino: (carona.destino ?? '').trim(),
      horario: carona.horario ?? '',
      data: carona.data ?? '',
      vagas: Number(carona.vagas ?? 0),
      linkMapa: (carona.linkMapa ?? '').trim(),
      motoristaEmail: this.normalizarEmail(carona.motoristaEmail),
      passageiros: this.normalizarPassageiros(carona.passageiros),
      criadoEm: carona.criadoEm ?? new Date().toISOString(),
    };
  }

  private normalizarPassageiros(
    passageiros?: UsuarioCarona[],
  ): UsuarioCarona[] {
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
        email,
      });
      return acumulado;
    }, []);
  }

  private usuarioEhMotorista(carona: Carona, usuario: UsuarioCarona): boolean {
    const emailNormalizado = this.normalizarEmail(usuario.email);
    if (!emailNormalizado) {
      return false;
    }

    return this.normalizarEmail(carona.motoristaEmail) === emailNormalizado;
  }

  private normalizarEmail(email?: string): string {
    return (email ?? '').trim().toLowerCase();
  }

  private normalizarTexto(texto?: string): string {
    return (texto ?? '').trim().toLowerCase();
  }
}
