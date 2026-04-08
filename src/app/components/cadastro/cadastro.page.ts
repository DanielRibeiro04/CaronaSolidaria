import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario';

@Component({
  selector: 'app-cadastro',
  standalone:false,
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
})
export class CadastroPage implements OnInit {
  cadastro = {
    primeiroNome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    cep: '',
    rua: '',
    bairro: '',
    numero: '',
    senha: ''
  };

  constructor(
    private router: Router,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit() {
  }

  criarConta() {
    const nomeCompleto = `${this.cadastro.primeiroNome} ${this.cadastro.sobrenome}`.trim();

    if (!nomeCompleto) {
      alert('Por favor, informe seu nome.');
      return;
    }

    if (!this.cadastro.email.trim()) {
      alert('Por favor, informe seu email.');
      return;
    }

    if (!this.cadastro.senha.trim()) {
      alert('Por favor, crie uma senha.');
      return;
    }

    this.usuarioService.salvarCadastro({
      nome: nomeCompleto,
      email: this.cadastro.email,
      senha: this.cadastro.senha,
      telefone: this.cadastro.telefone,
      cep: this.cadastro.cep,
      rua: this.cadastro.rua,
      bairro: this.cadastro.bairro,
      numero: this.cadastro.numero
    });

    alert('Conta criada com sucesso! Agora faca login para acompanhar suas caronas.');
    this.router.navigate(['/login']);
  }
}
