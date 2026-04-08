import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { CaronaService, NovaCarona } from '../../services/carona';
import { Usuario, UsuarioService } from '../../services/usuario';

@Component({
  selector: 'app-oferecer-carona',
  standalone: false,
  templateUrl: './oferecer-carona.page.html',
  styleUrls: ['./oferecer-carona.page.scss'],
})
export class OferecerCaronaPage implements OnInit {
  carona: NovaCarona = this.criarCaronaInicial();
  usuarioAtual: Usuario | null = null;
  modoEdicao = false;
  private caronaId?: number;

  constructor(
    private route: ActivatedRoute,
    private caronaService: CaronaService,
    private navCtrl: NavController,
    private usuarioService: UsuarioService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.usuarioAtual = this.usuarioService.obterUsuarioAtual();
    this.route.paramMap.subscribe(async params => {
      const idParam = params.get('id');
      const id = idParam ? Number(idParam) : NaN;
      this.modoEdicao = !!idParam && !isNaN(id);
      this.caronaId = this.modoEdicao ? id : undefined;
      await this.carregarFormulario();
    });
  }

  get tituloPagina(): string {
    return this.modoEdicao ? 'Editar Carona' : 'Oferecer Carona';
  }

  get textoBotaoPrincipal(): string {
    return this.modoEdicao ? 'SALVAR ALTERACOES' : 'OFERECER CARONA';
  }

  async salvar() {
    if (!this.carona.nome.trim()) {
      alert('Por favor, digite seu nome');
      return;
    }
    if (!this.carona.origem.trim()) {
      alert('Por favor, digite a origem');
      return;
    }
    if (!this.carona.destino.trim()) {
      alert('Por favor, digite o destino');
      return;
    }
    if (!this.carona.horario) {
      alert('Por favor, selecione o horario');
      return;
    }
    if (Number(this.carona.vagas) <= 0) {
      alert('Por favor, defina um numero de vagas valido');
      return;
    }

    const dadosCarona: NovaCarona = {
      ...this.carona,
      nome: this.usuarioAtual?.nome || this.carona.nome,
      motoristaEmail: this.usuarioAtual?.email || this.carona.motoristaEmail,
      vagas: Number(this.carona.vagas)
    };

    if (this.modoEdicao && this.caronaId) {
      if (!this.usuarioAtual) {
        await this.exibirToast('Faca login para editar essa carona.', 'warning');
        return;
      }

      const resultado = this.caronaService.atualizarCarona(this.caronaId, dadosCarona, {
        nome: this.usuarioAtual.nome,
        email: this.usuarioAtual.email
      });

      await this.exibirToast(resultado.mensagem, resultado.sucesso ? 'success' : 'warning');

      if (resultado.sucesso) {
        this.navCtrl.navigateRoot(`/detalhes-carona/${this.caronaId}`);
      }
      return;
    }

    this.caronaService.adicionar(dadosCarona);

    this.carona = this.criarCaronaInicial();
    if (this.usuarioAtual) {
      this.carona.nome = this.usuarioAtual.nome;
      this.carona.motoristaEmail = this.usuarioAtual.email;
    }

    this.navCtrl.navigateRoot('/tabs/tab1');
  }

  voltar() {
    if (this.modoEdicao && this.caronaId) {
      this.navCtrl.navigateRoot(`/detalhes-carona/${this.caronaId}`);
      return;
    }

    this.navCtrl.navigateRoot('/tabs/tab1');
  }

  private async carregarFormulario() {
    if (!this.modoEdicao || !this.caronaId) {
      this.carona = this.criarCaronaInicial();
      if (this.usuarioAtual) {
        this.carona.nome = this.usuarioAtual.nome;
        this.carona.motoristaEmail = this.usuarioAtual.email;
      }
      return;
    }

    const caronaExistente = this.caronaService.buscarPorId(this.caronaId);
    if (!caronaExistente) {
      await this.exibirToast('Carona nao encontrada.', 'warning');
      this.navCtrl.navigateRoot('/tabs/tab2');
      return;
    }

    if (!this.usuarioAtual || !this.caronaService.ehMotoristaDaCarona(caronaExistente, this.usuarioAtual)) {
      await this.exibirToast('Apenas o motorista pode editar essa carona.', 'warning');
      this.navCtrl.navigateRoot(`/detalhes-carona/${this.caronaId}`);
      return;
    }

    this.carona = {
      nome: caronaExistente.nome,
      origem: caronaExistente.origem,
      destino: caronaExistente.destino,
      horario: caronaExistente.horario,
      vagas: caronaExistente.vagas,
      linkMapa: caronaExistente.linkMapa,
      motoristaEmail: caronaExistente.motoristaEmail
    };
  }

  private criarCaronaInicial(): NovaCarona {
    return {
      nome: '',
      origem: '',
      destino: '',
      horario: '',
      vagas: 0,
      linkMapa: '',
      motoristaEmail: undefined
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
