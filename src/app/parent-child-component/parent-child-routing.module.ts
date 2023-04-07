import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PadreComponent } from './padre/padre.component';

const routes: Routes = [
  {
    path: '',
    component: PadreComponent
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParentChildRoutingModule { }
