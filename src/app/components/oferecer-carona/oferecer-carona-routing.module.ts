import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OferecerCaronaPage } from './oferecer-carona.page';

const routes: Routes = [
  {
    path: '',
    component: OferecerCaronaPage
  },
  {
    path: ':id',
    component: OferecerCaronaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OferecerCaronaPageRoutingModule {}
