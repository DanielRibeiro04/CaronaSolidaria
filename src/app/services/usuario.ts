import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  setDoc,
} from 'firebase/firestore';
import { firebaseDb } from '../firebase.config';

export interface Usuario {
  id?: string;
  nome: string;
  email: string;
  senha?: string;
  telefone?: string;
  cep?: string;
  rua?: string;
  bairro?: string;
  numero?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private readonly usuariosCollection = 'usuarios';
  private usuarioAtual: Usuario | null = null;

  async salvarCadastro(usuario: Usuario): Promise<Usuario> {
    console.log('UsuarioService.salvarCadastro chamado com:', usuario);
    const usuarioNormalizado = this.normalizarUsuario(usuario);
    console.log('Usuario normalizado:', usuarioNormalizado);

    const usuariosRef = collection(firebaseDb, this.usuariosCollection);
    const usuarioParaSalvar = this.prepararUsuarioParaPersistencia(
      usuarioNormalizado,
    );

    try {
      // Verificar se já existe usuário com este email
      const q = query(
        usuariosRef,
        where('email', '==', usuarioNormalizado.email),
      );
      const querySnapshot = await getDocs(q);
      console.log('Query de email retornou documentos:', querySnapshot.size);

      if (!querySnapshot.empty) {
        // Atualizar usuário existente
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, usuarioParaSalvar);
        return { ...usuarioNormalizado, id: docRef.id };
      } else {
        // Criar novo usuário com ID gerado
        const id = Date.now().toString();
        await setDoc(
          doc(firebaseDb, this.usuariosCollection, id),
          usuarioParaSalvar,
        );
        return { ...usuarioNormalizado, id };
      }
    } catch (error: any) {
      console.error('Erro no UsuarioService.salvarCadastro:', error);
      throw new Error(
        `Erro ao salvar cadastro: ${error?.message ?? String(error)}`,
      );
    }
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const emailNormalizado = this.normalizarEmail(email);
    if (!emailNormalizado) {
      return null;
    }

    const usuariosRef = collection(firebaseDb, this.usuariosCollection);
    const q = query(usuariosRef, where('email', '==', emailNormalizado));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { ...(doc.data() as Usuario), id: doc.id };
  }

  async definirUsuarioAtual(usuario: Usuario): Promise<void> {
    const usuarioNormalizado = this.normalizarUsuario(usuario);
    if (!usuarioNormalizado.id) {
      const salvo = await this.salvarCadastro(usuarioNormalizado);
      this.usuarioAtual = salvo;
    } else {
      this.usuarioAtual = usuarioNormalizado;
    }
  }

  obterUsuarioAtual(): Usuario | null {
    return this.usuarioAtual;
  }

  async criarSessaoFallback(email: string): Promise<Usuario> {
    const emailNormalizado = this.normalizarEmail(email);
    const nomeBase = emailNormalizado.split('@')[0] || 'usuario';
    const nome = nomeBase
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(' ');

    const usuario = this.normalizarUsuario({
      nome: nome || 'Usuario',
      email: emailNormalizado,
    });

    const usuarioSalvo = await this.salvarCadastro(usuario);
    this.usuarioAtual = usuarioSalvo;
    return usuarioSalvo;
  }

  async atualizarUsuarioAtual(
    dados: Usuario,
  ): Promise<{
    sucesso: boolean;
    mensagem: string;
    usuarioAnterior?: Usuario;
    usuarioAtualizado?: Usuario;
  }> {
    const usuarioAnterior = this.obterUsuarioAtual();
    if (!usuarioAnterior) {
      return {
        sucesso: false,
        mensagem: 'Faça login para editar seu perfil.',
      };
    }

    const usuarioAtualizado = this.normalizarUsuario({
      ...usuarioAnterior,
      ...dados,
    });

    // Verificar se email já existe em outro usuário
    if (usuarioAtualizado.email !== usuarioAnterior.email) {
      const existente = await this.buscarPorEmail(usuarioAtualizado.email);
      if (existente) {
        return {
          sucesso: false,
          mensagem: 'Já existe um usuário cadastrado com esse email.',
        };
      }
    }

    // Atualizar no Firestore se o usuário tem ID
    if (usuarioAnterior.id) {
      const docRef = doc(
        firebaseDb,
        this.usuariosCollection,
        usuarioAnterior.id,
      );
      const usuarioParaAtualizar =
        this.prepararUsuarioParaPersistencia(usuarioAtualizado);
      await updateDoc(docRef, usuarioParaAtualizar);
    } else {
      // Se não tem ID, salvar como novo
      const saved = await this.salvarCadastro(usuarioAtualizado);
      usuarioAtualizado.id = saved.id;
    }

    await this.definirUsuarioAtual(usuarioAtualizado);

    return {
      sucesso: true,
      mensagem: 'Perfil atualizado com sucesso.',
      usuarioAnterior,
      usuarioAtualizado,
    };
  }

  private async listarUsuarios(): Promise<Usuario[]> {
    const usuariosRef = collection(firebaseDb, this.usuariosCollection);
    const querySnapshot = await getDocs(usuariosRef);
    return querySnapshot.docs.map((doc) => ({
      ...(doc.data() as Usuario),
      id: doc.id,
    }));
  }

  private normalizarUsuario(usuario: Usuario): Usuario {
    return {
      ...(usuario.id ? { id: usuario.id } : {}),
      nome: (usuario.nome ?? '').trim(),
      email: this.normalizarEmail(usuario.email ?? ''),
      senha: (usuario.senha ?? '').trim(),
      telefone: (usuario.telefone ?? '').trim(),
      cep: (usuario.cep ?? '').trim(),
      rua: (usuario.rua ?? '').trim(),
      bairro: (usuario.bairro ?? '').trim(),
      numero: (usuario.numero ?? '').trim(),
    };
  }

  private normalizarEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private prepararUsuarioParaPersistencia(
    usuario: Usuario,
  ): Omit<Usuario, 'id'> {
    const { id: _id, ...usuarioSemId } = usuario;
    return usuarioSemId;
  }
}
