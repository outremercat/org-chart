import { Component, Input, OnChanges, SimpleChange, EventEmitter, Output } from '@angular/core';
import { OnInit } from '@angular/core';

import { Employee } from './employee';
import { EmployeeSearchComponent } from './employee-search.component'
import { EmployeeService } from "./employee.service";

@Component({
   moduleId: module.id,
   selector: 'employee-details',
   templateUrl: 'employee-details.component.html',
   styleUrls: [ 'employee-details.component.css' ]   
})

export class EmployeeDetailsComponent implements OnInit {

    @Input() employee: Employee;
    @Input() yPosition: number = 0;
    @Input() orgSize: number = 0;
    @Input() orgSizeICs: number = 0;
    @Input() directsOnly: boolean = false;

    @Output() boxClosed = new EventEmitter<boolean>(); 

    constructor (private employeeService: EmployeeService) {
    }

    ngOnInit(): void { 
    }

    clickedCloseBox() {
        this.boxClosed.emit(true);   
    }
}
