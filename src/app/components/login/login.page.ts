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

  entrar() {
    if (!this.credenciais.email.trim()) {
      alert('Por favor, informe seu email.');
      return;
    }

    const usuarioCadastrado = this.usuarioService.buscarPorEmail(this.credenciais.email);

    if (usuarioCadastrado) {
      if (usuarioCadastrado.senha && usuarioCadastrado.senha !== this.credenciais.senha) {
        alert('Senha incorreta.');
        return;
      }

      this.usuarioService.definirUsuarioAtual(usuarioCadastrado);
    } else {
      this.usuarioService.criarSessaoFallback(this.credenciais.email);
    }

    this.router.navigate(['/tabs/tab1']);
  }
}
