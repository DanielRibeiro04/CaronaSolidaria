import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Carona, CaronaService } from '../services/carona';
import { Usuario, UsuarioService } from '../services/usuario';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit, OnDestroy {
  usuarioAtual: Usuario | null = null;
  caronasComoPassageiro: Carona[] = [];
  caronasComoMotorista: Carona[] = [];
  private caronaSubscription?: Subscription;

  constructor(
    private navCtrl: NavController,
    private caronaService: CaronaService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    this.caronaSubscription = this.caronaService.getCaronas().subscribe(() => {
      this.atualizarCaronas();
    });
    this.atualizarCaronas();
  }

  ionViewWillEnter() {
    this.atualizarCaronas();
  }

  ngOnDestroy() {
    this.caronaSubscription?.unsubscribe();
  }

  get totalCaronas(): number {
    return this.caronasComoPassageiro.length + this.caronasComoMotorista.length;
  }

  verDetalhes(id: string) {
    this.navCtrl.navigateForward(`/detalhes-carona/${id}`);
  }

  irParaLogin() {
    this.navCtrl.navigateRoot('/login');
  }

  explorarCaronas() {
    this.navCtrl.navigateRoot('/tabs/tab1');
  }

  private atualizarCaronas() {
    this.usuarioAtual = this.usuarioService.obterUsuarioAtual();

    if (!this.usuarioAtual) {
      this.caronasComoPassageiro = [];
      this.caronasComoMotorista = [];
      return;
    }

    this.caronasComoPassageiro = this.caronaService.listarComoPassageiro(this.usuarioAtual);
    this.caronasComoMotorista = this.caronaService.listarComoMotorista(this.usuarioAtual);
  }
}
