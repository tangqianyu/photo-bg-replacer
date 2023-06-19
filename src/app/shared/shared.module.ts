/* eslint-disable max-len */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { ColorPickerModule } from 'ngx-color-picker';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    NzUploadModule,
    NzIconModule,
    NzButtonModule,
    NzImageModule,
    NzStepsModule,
    ColorPickerModule,
    NzMessageModule,
    NzNotificationModule,
    NzSelectModule,
    NzSpinModule
  ],
  exports: [
    TranslateModule,
    WebviewDirective,
    FormsModule,
    NzUploadModule,
    NzIconModule,
    NzButtonModule,
    NzImageModule,
    NzStepsModule,
    ColorPickerModule,
    NzMessageModule,
    NzNotificationModule,
    NzSelectModule,
    NzSpinModule
  ]
})
export class SharedModule {}
