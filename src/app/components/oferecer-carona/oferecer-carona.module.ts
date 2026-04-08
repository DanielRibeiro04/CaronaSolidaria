import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OferecerCaronaPageRoutingModule } from './oferecer-carona-routing.module';

import { OferecerCaronaPage } from './oferecer-carona.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OferecerCaronaPageRoutingModule
  ],
  declarations: [OferecerCaronaPage]
})
export class OferecerCaronaPageModule {}
