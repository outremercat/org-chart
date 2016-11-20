import { Component, Input, OnChanges, SimpleChange } from '@angular/core';


import { Employee } from './employee';
import { EmployeeRow } from './employee-row'
import { EmployeeSearchComponent } from './employee-search.component'

import { OnInit } from '@angular/core';

import { EmployeeService } from "./employee.service";

@Component({
   moduleId: module.id,
   selector: 'employee-list',
   templateUrl: 'employee-list.component.html',
   styleUrls: [ 'employee-list.component.css' ]   
})

export class EmployeeListComponent implements OnInit,OnChanges {
    @Input() searchTerm : string;

    errorMessage: string;
    employees: EmployeeRow[];
    boxInput = 'Bob Wood';

  

    constructor (private employeeService: EmployeeService) {
    }

    ngOnInit() { 
        this.getEmployees(); 
        console.log(this.searchTerm);
    }

    ngOnChanges(changes: {[propKey: string]: SimpleChange}) {
        let log: string[] = [];
        for (let propName in changes) {
            let changedProp = changes[propName];
            let from = JSON.stringify(changedProp.previousValue);
            let to =   JSON.stringify(changedProp.currentValue);
            console.log( `${propName} changed from ${from} to ${to}`);
        }
        // remove leading and trailing double quotes
        this.employees = this.employeeService.createEmployeeTable(changes['searchTerm'].currentValue);
    }

    getEmployees() {
        this.employeeService.getEmployees(this.searchTerm)
            .then(employees => this.employees = employees);
    }

    getIndent(empObj: Employee): number {
        return empObj.level*50;
    }

    onKey(event: KeyboardEvent) {
        this.boxInput =  (<HTMLInputElement>event.target).value;
        if (this.boxInput == "") {
            return
        }
        this.employees = this.employeeService.createEmployeeTable(this.boxInput)
    }
}
