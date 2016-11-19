import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule, JsonpModule } from '@angular/http';

import { AppComponent }  from './app.component';

import { EmployeeService } from './employee.service'
import { EmployeeListComponent } from './employee-list.component'
import { EmployeeSearchComponent } from './employee-search.component'

import './rxjs-extensions';


@NgModule({
  imports:      [ BrowserModule, 
                  FormsModule, 
                  HttpModule, 
                  JsonpModule ],

  declarations: [ AppComponent,
                  EmployeeListComponent,
                  EmployeeSearchComponent
  ],

  providers:    [ EmployeeService ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
