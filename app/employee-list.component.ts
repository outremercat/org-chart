import { Component, Input, OnChanges, SimpleChange, EventEmitter, Output } from '@angular/core';
import { OnInit } from '@angular/core';


import { Employee } from './employee';
import { EmployeeRow } from './employee-row'
import { EmployeeSearchComponent } from './employee-search.component'
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

    ngOnInit(): void { 
        this.getEmployees(); 
    }

    // gets called when Input properties change
    ngOnChanges(changes: {[propKey: string]: SimpleChange}): void {
        //this.employees = this.employeeService.createEmployeeTable(changes['searchTerm'].currentValue,
        //                                                          changes['directsOnly'].currentValue);
        this.employees = this.employeeService.createEmployeeTable(this.searchTerm, this.directsOnly);
        this.managerChain = this.employeeService.lastManagerChain;
    }

    getEmployees(): void {
        this.employeeService.getEmployees(this.searchTerm)
            .then(employees => { this.employees = employees;
                                 this.managerChain = this.employeeService.lastManagerChain; 
                               });
    }

    getIndent(empObj: Employee): number {
        return (empObj.level-1)*40;
    }

    managerClicked(managerName: string) : void {
        this.searchTerm = managerName;
        this.employees = this.employeeService.createEmployeeTable(this.searchTerm, this.directsOnly);
        this.managerChain = this.employeeService.lastManagerChain;
    }
    
}
