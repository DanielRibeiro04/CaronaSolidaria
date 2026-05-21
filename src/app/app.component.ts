import { Component } from '@angular/core';
import { CaronaService } from './services/carona';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private caronaService: CaronaService) {}
  ngOnInit() {

  window.addEventListener('online', async () => {

    const pendentes = JSON.parse(
      localStorage.getItem('caronas-pendentes') || '[]'
    );

    for (const carona of pendentes) {

      await this.caronaService.adicionar(carona);

    }

    localStorage.removeItem('caronas-pendentes');

    if (pendentes.length > 0) {
      alert('Caronas pendentes enviadas!');
    }

  });

}
}
