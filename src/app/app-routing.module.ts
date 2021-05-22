import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MantenedorComponent } from './mantenedor/mantenedor.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'mantenedor', component: MantenedorComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
