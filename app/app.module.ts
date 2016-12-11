import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule, JsonpModule } from '@angular/http';
import './rxjs-extensions';

import { AppComponent }  from './app.component';

import { EmployeeService } from './employee.service'
import { EmployeeListComponent } from './employee-list.component'
import { EmployeeSearchComponent } from './employee-search.component'
import { EmployeeDetailsComponent } from './employee-details.component'



@NgModule({
  imports:      [ BrowserModule, 
                  FormsModule, 
                  HttpModule, 
                  JsonpModule ],

  declarations: [ AppComponent,
                  EmployeeListComponent,
                  EmployeeSearchComponent,
                  EmployeeDetailsComponent
  ],

  providers:    [ EmployeeService ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
