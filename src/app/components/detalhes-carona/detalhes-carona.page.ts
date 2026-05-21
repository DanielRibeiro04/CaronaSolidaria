import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AlertController, IonicModule, NavController, ToastController } from '@ionic/angular';
import { Carona, CaronaService } from '../../services/carona';
import { Usuario, UsuarioService } from '../../services/usuario';

@Component({
  selector: 'app-detalhes-carona',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './detalhes-carona.page.html',
  styleUrls: ['./detalhes-carona.page.scss'],
})
export class DetalhesCaronaPage implements OnInit {
  carona?: Carona;
  usuarioAtual: Usuario | null = null;
  ehMotorista = false;
  ehPassageiro = false;

  constructor(
    private route: ActivatedRoute,
    private caronaService: CaronaService,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private usuarioService: UsuarioService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.carregarDados();
  }

  ionViewWillEnter() {
    this.carregarDados();
  }

  abrirRota() {
    if (!this.carona) {
      return;
    }

    const url = this.carona.linkMapa
      ? this.carona.linkMapa
      : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(this.carona.origem)}&destination=${encodeURIComponent(this.carona.destino)}`;

    window.open(url, '_blank');
  }

  conversarWhatsapp() {
    const telefone = '5551999999999';
    const texto = `Ola, gostaria de pegar a carona de ${this.carona?.origem} para ${this.carona?.destino} as ${this.carona?.horario}.`;
    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  }

  voltarTab1() {
    this.navCtrl.navigateRoot('/tabs/tab1');
  }

  editarCarona() {
    if (!this.carona || !this.ehMotorista) {
      return;
    }

    this.navCtrl.navigateForward(`/oferecer-carona/${this.carona.id}`);
  }

  async confirmarExclusao() {
    if (!this.carona || !this.ehMotorista || !this.usuarioAtual) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Excluir carona',
      message: 'Tem certeza que deseja excluir essa carona? Essa acao nao pode ser desfeita.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: async () => {
            const resultado = await this.caronaService.excluirCarona(this.carona!.id, {
              nome: this.usuarioAtual!.nome,
              email: this.usuarioAtual!.email
            });

            await this.exibirToast(resultado.mensagem, resultado.sucesso ? 'success' : 'warning');

            if (resultado.sucesso) {
              this.navCtrl.navigateRoot('/tabs/tab2');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmarCancelamentoParticipacao() {
    if (!this.carona || !this.ehPassageiro || !this.usuarioAtual) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Cancelar participacao',
      message: 'Deseja sair dessa carona? Sua vaga sera liberada para outra pessoa.',
      buttons: [
        {
          text: 'Voltar',
          role: 'cancel'
        },
        {
          text: 'Cancelar carona',
          role: 'destructive',
          handler: async () => {
            const resultado = await this.caronaService.cancelarParticipacao(this.carona!.id, {
              nome: this.usuarioAtual!.nome,
              email: this.usuarioAtual!.email
            });

            await this.exibirToast(resultado.mensagem, resultado.sucesso ? 'success' : 'warning');

            if (resultado.sucesso) {
              this.navCtrl.navigateRoot('/tabs/tab2');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async pegarCarona() {
    if (!this.carona) {
      return;
    }

    const usuarioAtual = this.usuarioService.obterUsuarioAtual();

    if (!usuarioAtual) {
      await this.exibirToast('Faça login para acompanhar suas caronas na aba Minhas.', 'warning');
      return;
    }

    const resultado = await this.caronaService.pegarCarona(this.carona.id, {
      nome: usuarioAtual.nome,
      email: usuarioAtual.email
    });

    this.carona = resultado.carona ?? this.caronaService.buscarPorId(this.carona.id);
    this.atualizarPerfilNaCarona(usuarioAtual);

    await this.exibirToast(resultado.mensagem, resultado.sucesso ? 'success' : 'warning');

    if (resultado.sucesso) {
      this.navCtrl.navigateRoot('/tabs/tab1');
    }
  }

  private carregarDados() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.usuarioAtual = this.usuarioService.obterUsuarioAtual();

    if (!idParam) {
      this.carona = undefined;
      this.ehMotorista = false;
      this.ehPassageiro = false;
      return;
    }

    this.carona = this.caronaService.buscarPorId(idParam);
    this.atualizarPerfilNaCarona(this.usuarioAtual);
  }

  private atualizarPerfilNaCarona(usuario: Usuario | null) {
    if (!this.carona || !usuario) {
      this.ehMotorista = false;
      this.ehPassageiro = false;
      return;
    }

    this.ehMotorista = this.caronaService.ehMotoristaDaCarona(this.carona, usuario);
    this.ehPassageiro = !this.ehMotorista && this.caronaService.ehPassageiroDaCarona(this.carona, usuario);
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
