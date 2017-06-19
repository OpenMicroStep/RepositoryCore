import { NgModule, ANALYZE_FOR_ENTRY_COMPONENTS, InjectionToken }      from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { MdCheckboxModule, MdButtonModule, MdInputModule }        from '@angular/material';
import { AspectComponent }  from './aspect.component';
import './vo.input.component';
import { VOInputTextComponent }  from './vo.input.text.component';
import { VOInputCheckboxComponent }  from './vo.input.checkbox.component';
import { VOInputSetComponent }  from './vo.input.set.component';
import { VOInputSelectComponent }  from './vo.input.select.component';
import { VOComponent }  from './vo.component';

@NgModule({
  imports:      [ CommonModule, FormsModule ],
  declarations: [ VOInputTextComponent, VOInputCheckboxComponent, VOInputSetComponent, VOInputSelectComponent ],
  exports:      [ VOInputTextComponent, VOInputCheckboxComponent, VOInputSetComponent, VOInputSelectComponent ],
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
