import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DetalhesCaronaPage } from './detalhes-carona.page';

const routes: Routes = [
  {
    path: '',
    component: DetalhesCaronaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DetalhesCaronaPageRoutingModule {}
