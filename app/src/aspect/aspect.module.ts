import { NgModule, ANALYZE_FOR_ENTRY_COMPONENTS, InjectionToken }      from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { AspectComponent }  from './aspect.component';
import './vo.input.component';
import { VOInputTextComponent }  from './vo.input.text.component';
import { VOInputCheckboxComponent }  from './vo.input.checkbox.component';
import { VOInputSetComponent }  from './vo.input.set.component';
import { VOInputSelectComponent, InputSelectComponent }  from './vo.input.select.component';
import { VOInputSetSelectComponent }  from './vo.input.setselect.component';
import { VOLoadComponent }  from './vo.component';

@NgModule({
  imports:      [ CommonModule, FormsModule ],
  declarations: [ VOInputTextComponent, VOInputCheckboxComponent, VOInputSetComponent, VOInputSelectComponent, VOInputSetSelectComponent, InputSelectComponent ],
  exports:      [ VOInputTextComponent, VOInputCheckboxComponent, VOInputSetComponent, VOInputSelectComponent, VOInputSetSelectComponent ],
})
export class AspectModule {
  static withComponents(components: any[]) {
    return {
      ngModule: AspectModule,
      providers: [
          {provide: ANALYZE_FOR_ENTRY_COMPONENTS, useValue: components, multi: true}
      ]
    }
  }
}
