import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ServerTestClientComponent } from './server-test-client/server-test-client.component';

const routes: Routes = [{ path: '', component: ServerTestClientComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
