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

  async criarConta() {
    console.log('CadastroPage.criarConta() chamado');
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

    try {
      const cadastroPayload = {
        nome: nomeCompleto,
        email: this.cadastro.email,
        senha: this.cadastro.senha,
        telefone: this.cadastro.telefone,
        cep: this.cadastro.cep,
        rua: this.cadastro.rua,
        bairro: this.cadastro.bairro,
        numero: this.cadastro.numero
      };
      console.log('Tentando criar conta com payload:', cadastroPayload);

      await this.usuarioService.salvarCadastro(cadastroPayload);

      alert('Conta criada com sucesso! Agora faça login para acompanhar suas caronas.');
      this.desfocarElementoAtivo();
      await this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      const mensagemErro = error?.message || String(error) || 'Erro desconhecido ao criar a conta.';
      alert(`Erro ao criar a conta: ${mensagemErro}`);
    }
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
