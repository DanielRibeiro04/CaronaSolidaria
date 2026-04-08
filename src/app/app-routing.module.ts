import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { PaginaInicialComponent } from './components/pagina-inicial/pagina-inicial.component';

const routes: Routes = [

  // Tela inicial
  {
    path: '',
    component: PaginaInicialComponent
  },

  // Login
  {
    path: 'login',
    loadChildren: () =>
      import('./components/login/login.module').then(m => m.LoginPageModule)
  },

  // Cadastro
  {
    path: 'cadastro',
    loadChildren: () =>
      import('./components/cadastro/cadastro.module').then(m => m.CadastroPageModule)
  },

  // Área principal do app (com Tabs)
  {
    path: 'tabs',
    loadChildren: () =>
      import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'oferecer-carona',
    loadChildren: () => import('./components/oferecer-carona/oferecer-carona.module').then( m => m.OferecerCaronaPageModule)
  },
  {
    path: 'detalhes-carona/:id',
    loadComponent: () => import('./components/detalhes-carona/detalhes-carona.page').then( m => m.DetalhesCaronaPage)
  },

  // Rota coringa (segurança)
  {
    path: '**',
    redirectTo: ''
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
