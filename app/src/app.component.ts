import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  template:
  `
<div class="container">
  <div class="row">
    <h1>Repository</h1>
  </div>
  <div class="row"><manage-persons></manage-persons></div>
  <div class="row"><manage-applications></manage-applications></div>
  <div class="row"><manage-authorizations></manage-authorizations></div>
</div>
`
})
export class AppComponent {

}
