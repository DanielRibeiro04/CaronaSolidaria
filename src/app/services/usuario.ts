import { Injectable } from '@angular/core';

export interface Usuario {
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
  providedIn: 'root'
})
export class UsuarioService {
  private readonly usuarioAtualKey = 'usuario_logado';
  private readonly usuariosKey = 'usuarios_cadastrados';

  salvarCadastro(usuario: Usuario): Usuario {
    const usuarioNormalizado = this.normalizarUsuario(usuario);
    const usuarios = this.listarUsuarios();
    const indiceExistente = usuarios.findIndex(
      usuarioSalvo => this.normalizarEmail(usuarioSalvo.email) === usuarioNormalizado.email
    );

    if (indiceExistente >= 0) {
      usuarios[indiceExistente] = {
        ...usuarios[indiceExistente],
        ...usuarioNormalizado
      };
    } else {
      usuarios.push(usuarioNormalizado);
    }

    localStorage.setItem(this.usuariosKey, JSON.stringify(usuarios));
    return usuarioNormalizado;
  }

  buscarPorEmail(email: string): Usuario | null {
    const emailNormalizado = this.normalizarEmail(email);
    if (!emailNormalizado) {
      return null;
    }

    return this.listarUsuarios().find(usuario => this.normalizarEmail(usuario.email) === emailNormalizado) ?? null;
  }

  definirUsuarioAtual(usuario: Usuario): void {
    const usuarioNormalizado = this.normalizarUsuario(usuario);
    localStorage.setItem(this.usuarioAtualKey, JSON.stringify(usuarioNormalizado));
  }

  obterUsuarioAtual(): Usuario | null {
    const valor = localStorage.getItem(this.usuarioAtualKey);
    if (!valor) {
      return null;
    }

    try {
      return this.normalizarUsuario(JSON.parse(valor) as Usuario);
    } catch {
      return null;
    }
  }

  criarSessaoFallback(email: string): Usuario {
    const emailNormalizado = this.normalizarEmail(email);
    const nomeBase = emailNormalizado.split('@')[0] || 'usuario';
    const nome = nomeBase
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(' ');

    const usuario = this.normalizarUsuario({
      nome: nome || 'Usuario',
      email: emailNormalizado
    });

    this.definirUsuarioAtual(usuario);
    return usuario;
  }

  atualizarUsuarioAtual(dados: Usuario): { sucesso: boolean; mensagem: string; usuarioAnterior?: Usuario; usuarioAtualizado?: Usuario } {
    const usuarioAnterior = this.obterUsuarioAtual();
    if (!usuarioAnterior) {
      return {
        sucesso: false,
        mensagem: 'Faca login para editar seu perfil.'
      };
    }

    const usuarioAtualizado = this.normalizarUsuario({
      ...usuarioAnterior,
      ...dados
    });

    const usuarios = this.listarUsuarios();
    const emailAnterior = this.normalizarEmail(usuarioAnterior.email);
    const indiceAtual = usuarios.findIndex(usuario => this.normalizarEmail(usuario.email) === emailAnterior);
    const emailDuplicado = usuarios.some((usuario, indice) =>
      indice !== indiceAtual && this.normalizarEmail(usuario.email) === usuarioAtualizado.email
    );

    if (emailDuplicado) {
      return {
        sucesso: false,
        mensagem: 'Ja existe um usuario cadastrado com esse email.'
      };
    }

    if (indiceAtual >= 0) {
      usuarios[indiceAtual] = {
        ...usuarios[indiceAtual],
        ...usuarioAtualizado
      };
    } else {
      usuarios.push(usuarioAtualizado);
    }

    localStorage.setItem(this.usuariosKey, JSON.stringify(usuarios));
    this.definirUsuarioAtual(usuarioAtualizado);

    return {
      sucesso: true,
      mensagem: 'Perfil atualizado com sucesso.',
      usuarioAnterior,
      usuarioAtualizado
    };
  }

  private listarUsuarios(): Usuario[] {
    const valor = localStorage.getItem(this.usuariosKey);
    if (!valor) {
      return [];
    }

    try {
      const usuarios = JSON.parse(valor) as Usuario[];
      return usuarios.map(usuario => this.normalizarUsuario(usuario));
    } catch {
      return [];
    }
  }

  private normalizarUsuario(usuario: Usuario): Usuario {
    return {
      nome: (usuario.nome ?? '').trim(),
      email: this.normalizarEmail(usuario.email ?? ''),
      senha: (usuario.senha ?? '').trim(),
      telefone: (usuario.telefone ?? '').trim(),
      cep: (usuario.cep ?? '').trim(),
      rua: (usuario.rua ?? '').trim(),
      bairro: (usuario.bairro ?? '').trim(),
      numero: (usuario.numero ?? '').trim()
    };
  }

  private normalizarEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
