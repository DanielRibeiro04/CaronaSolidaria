import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  credenciais = {
    email: '',
    senha: ''
  };

  constructor(
    private router: Router,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit() {
  }

  async entrar() {
    if (!this.credenciais.email.trim()) {
      alert('Por favor, informe seu email.');
      return;
    }

    const usuarioCadastrado = await this.usuarioService.buscarPorEmail(this.credenciais.email);

    if (usuarioCadastrado) {
      if (usuarioCadastrado.senha && usuarioCadastrado.senha !== this.credenciais.senha) {
        alert('Senha incorreta.');
        return;
      }

      await this.usuarioService.definirUsuarioAtual(usuarioCadastrado);
    } else {
      await this.usuarioService.criarSessaoFallback(this.credenciais.email);
    }

    this.desfocarElementoAtivo();
    await this.router.navigate(['/tabs/tab1']);
  }

  async irParaCadastro() {
    this.desfocarElementoAtivo();
    await this.router.navigate(['/cadastro']);
  }

  private desfocarElementoAtivo() {
    if (typeof document === 'undefined') {
      return;
    }

    const elementoAtivo = document.activeElement;
    if (elementoAtivo instanceof HTMLElement) {
      elementoAtivo.blur();
    }
  }
}
