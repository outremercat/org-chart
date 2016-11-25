import { Component, Input, OnChanges, SimpleChange, EventEmitter, Output } from '@angular/core';


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
    @Input() directsOnly: boolean; 

    errorMessage: string;
    employees: EmployeeRow[];
    managerChain: Employee[];

    constructor (private employeeService: EmployeeService) {
    }

    ngOnInit() { 
        this.getEmployees(); 
    }

    ngOnChanges(changes: {[propKey: string]: SimpleChange}) {
        //this.employees = this.employeeService.createEmployeeTable(changes['searchTerm'].currentValue,
        //                                                          changes['directsOnly'].currentValue);
        this.employees = this.employeeService.createEmployeeTable(this.searchTerm, this.directsOnly);
        this.managerChain = this.employeeService.lastManagerChain;
    }

    getEmployees() {
        this.employeeService.getEmployees(this.searchTerm)
            .then(employees => { this.employees = employees;
                                 this.managerChain = this.employeeService.lastManagerChain; 
                               });
    }

    getIndent(empObj: Employee): number {
        return (empObj.level-1)*40;
    }

}
