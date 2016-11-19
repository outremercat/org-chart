import { Component } from '@angular/core';

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

export class EmployeeListComponent implements OnInit {

    errorMessage: string;
    employees: EmployeeRow[];
    boxInput = 'Bob Wood';
   

    constructor (private employeeService: EmployeeService) {}

    ngOnInit() { this.getEmployees(); }

    getEmployees() {
        this.employeeService.getEmployees()
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
