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
    detailsOn: boolean = false;
    employeeSelected: Employee;
    orgSizeSelected: number; 

    yPosition: number = 0;

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
        this.detailsOn = false;
    }

    getEmployees(): void {
        this.employeeService.getEmployees(this.searchTerm)
            .then(employees => { this.employees = employees;
                                 this.managerChain = this.employeeService.lastManagerChain; 
                                 this.orgSizeSelected = this.employeeService.lastOrgSize;
                               });
    }

    getIndent(empObj: Employee): number {
        return (empObj.level-1)*40;
    }

    managerClicked(managerName: string, yPos: number) : void {
        // if the person selected is the manager at the top, then show the detail box, else reload the list
        if(managerName == this.searchTerm) {
            // show employee detail box
            this.employeeClicked(managerName, yPos);
        } else { 
            // refresh list
            this.searchTerm = managerName;
            this.employees = this.employeeService.createEmployeeTable(this.searchTerm, this.directsOnly);
            this.managerChain = this.employeeService.lastManagerChain;

            // clear the box
            this.detailsOn = false;
        }
    }
    
    employeeClicked(employeeName: string, yPos: number) : void {
        this.employeeSelected = this.employeeService.getEmployee(employeeName);
        this.detailsOn = true;
        if (employeeName != this.searchTerm) {
            this.orgSizeSelected = 0;
        } else {
            this.orgSizeSelected = this.employeeService.lastOrgSize;
        }
    }

    removeDetailsBox(closed: boolean) {
        this.detailsOn = false;
    }


}
