import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CaronaService, Carona } from '../../app/services/carona';

@Component({
  selector: 'app-tab1',
  standalone: false,
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit, OnDestroy {

  caronas: Carona[] = [];
  caronasExibidas: Carona[] = [];
  termoBusca: string = '';
  private caronaSubscription?: Subscription;

  constructor(
    private router: Router,
    private caronaService: CaronaService
  ) {}

  ngOnInit() {
    this.caronaSubscription = this.caronaService.getCaronas().subscribe(caronas => {
      this.caronas = caronas;
      this.filtrarCaronas();
    });
  }

  ngOnDestroy() {
    this.caronaSubscription?.unsubscribe();
  }

  private atualizarCaronas() {
    this.caronas = this.caronaService.listar();
    this.caronasExibidas = [...this.caronas];
  }

  filtrarCaronas() {
    if (!this.termoBusca.trim()) {
      this.caronasExibidas = [...this.caronas];
      return;
    }

    const termo = this.termoBusca.toLowerCase();
    this.caronasExibidas = this.caronas.filter(carona =>
      carona.origem.toLowerCase().includes(termo) ||
      carona.destino.toLowerCase().includes(termo) ||
      carona.nome.toLowerCase().includes(termo)
    );
  }

  verDetalhes(id: number) {
    this.router.navigate(['/detalhes-carona', id]);
  }

  irOferecer() {
    this.router.navigate(['/oferecer-carona']);
  }

  irPedir() {
    // TODO: Navegar para página de pedido de carona
    console.log('Navegar para pedido de carona');
  }
}

