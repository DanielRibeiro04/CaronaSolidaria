import { Component, OnInit } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { CaronaService } from '../services/carona';
import { DenunciaService } from '../services/denuncia';
import { Usuario, UsuarioService } from '../services/usuario';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page implements OnInit {
  usuarioAtual: Usuario | null = null;
  perfil = this.criarPerfilVazio();
  denuncia = {
    assunto: '',
    descricao: ''
  };

  constructor(
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private usuarioService: UsuarioService,
    private caronaService: CaronaService,
    private denunciaService: DenunciaService
  ) {}

  ngOnInit() {
    this.carregarPerfil();
  }

  ionViewWillEnter() {
    this.carregarPerfil();
  }

  get iniciaisUsuario(): string {
    if (!this.usuarioAtual?.nome) {
      return 'U';
    }

    return this.usuarioAtual.nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(parte => parte[0].toUpperCase())
      .join('');
  }

  async salvarPerfil() {
    if (!this.perfil.nome.trim()) {
      await this.exibirToast('Informe seu nome para salvar o perfil.', 'warning');
      return;
    }

    if (!this.perfil.email.trim()) {
      await this.exibirToast('Informe seu email para salvar o perfil.', 'warning');
      return;
    }

    const resultado = await this.usuarioService.atualizarUsuarioAtual({
      ...this.perfil,
      senha: this.perfil.senha.trim() || this.usuarioAtual?.senha || ''
    });

    if (!resultado.sucesso || !resultado.usuarioAnterior || !resultado.usuarioAtualizado) {
      await this.exibirToast(resultado.mensagem, 'warning');
      return;
    }

    this.caronaService.sincronizarUsuario(resultado.usuarioAnterior, resultado.usuarioAtualizado);
    this.usuarioAtual = resultado.usuarioAtualizado;
    this.preencherFormulario(resultado.usuarioAtualizado);
    this.perfil.senha = '';

    await this.exibirToast(resultado.mensagem, 'success');
  }

  async enviarDenuncia() {
    if (!this.usuarioAtual) {
      await this.exibirToast('Faça login para enviar uma denúncia.', 'warning');
      return;
    }

    if (!this.denuncia.descricao.trim()) {
      await this.exibirToast('Descreva o ocorrido antes de enviar.', 'warning');
      return;
    }

    await this.denunciaService.registrar({
      usuarioNome: this.usuarioAtual.nome,
      usuarioEmail: this.usuarioAtual.email,
      assunto: this.denuncia.assunto.trim() || 'Denúncia geral',
      descricao: this.denuncia.descricao
    });

    this.denuncia = {
      assunto: '',
      descricao: ''
    };

    await this.exibirToast('Denúncia enviada com sucesso.', 'success');
  }

  irParaLogin() {
    this.navCtrl.navigateRoot('/login');
  }

  private carregarPerfil() {
    this.usuarioAtual = this.usuarioService.obterUsuarioAtual();

    if (!this.usuarioAtual) {
      this.perfil = this.criarPerfilVazio();
      return;
    }

    this.preencherFormulario(this.usuarioAtual);
  }

  private preencherFormulario(usuario: Usuario) {
    this.perfil = {
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone || '',
      cep: usuario.cep || '',
      rua: usuario.rua || '',
      bairro: usuario.bairro || '',
      numero: usuario.numero || '',
      senha: ''
    };
  }

  private criarPerfilVazio() {
    return {
      nome: '',
      email: '',
      telefone: '',
      cep: '',
      rua: '',
      bairro: '',
      numero: '',
      senha: ''
    };
  }

  private async exibirToast(message: string, color: 'success' | 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      color
    });
    await toast.present();
  }
}
