import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule, JsonpModule } from '@angular/http';

import { AppComponent }  from './app.component';

import { EmployeeService } from './employee.service'
import { EmpListComponent } from './emp-list.component'

import './rxjs-extensions';


@NgModule({
  imports:      [ BrowserModule, 
                  FormsModule, 
                  HttpModule, 
                  JsonpModule ],

  declarations: [ AppComponent,
                  EmpListComponent,
  ],

  providers:    [ EmployeeService ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
