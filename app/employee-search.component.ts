import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable }        from 'rxjs/Observable';
import { Subject }           from 'rxjs/Subject';

import { EmployeeService } from "./employee.service";

@Component({
    moduleId: module.id,
    selector: 'employee-search',
    templateUrl: 'employee-search.component.html',
    styleUrls: [ 'employee-search.component.css' ],
})

export class EmployeeSearchComponent implements OnInit {
    @Input() searchTerm : string;   // this is the root search term
    @Output() onNewSearchTerm = new EventEmitter<string>();     // used by EmployeeList to update based on this search term
    @Output() onNewDirectsOnly = new EventEmitter<boolean>();     // used by EmployeeList to update based on the directs only checkbox


    employees: string[];              // array of employees
    aSearchBox: string;               // text in the search box
    directsOnly: boolean;             // checkbox 

    activeEmployee: string;           // active (highlighted) employee 
    private activeEmployeeIndex: number = -1;   // active (highlighted) employee index 
    private activeEmployeeListVisible: boolean;  
  
    constructor ( private employeeService: EmployeeService) {
    }

    ngOnInit(): void {

    }

    // called on every key
    search(term: string): void {
        if (term == "") {
            this.employees =  [];
            return;
        }
        this.employees = this.employeeService.searchCandidates(term);
        if (this.employees.length > 0) {
            this.activeEmployeeListVisible = true;
        } else {
            this.activeEmployeeListVisible = false;
        }
    }

    // let EmployeeList know that it needs to update 
    refreshSearch(empl: string): void {
        this.searchTerm = empl;
        // notify the other components
        this.onNewSearchTerm.emit(empl);
        this.onNewDirectsOnly.emit(this.directsOnly);
        this.employees = [];
        this.aSearchBox = "";
    }

    refreshSearchFromDirectsOnly(): void {
        // notify the other components
        this.directsOnly = !this.directsOnly
        this.onNewSearchTerm.emit(this.searchTerm);
        this.onNewDirectsOnly.emit(this.directsOnly);
    }


    // clear the value of the search box
    resetSearchBox(searchBox: any) {
        searchBox.value = "";
    }

    // process cursor up, down, enter and esc
    public keyDown(event: KeyboardEvent) {
        if (event.which === 40 || event.keyCode === 40) { // DOWN    
            // If not found, then activate the first employee 
            if (this.activeEmployeeIndex === -1) {
                this.activeEmployeeIndex = 0; 
                this.setActiveEmployee();
                return;
            }
            if (this.activeEmployeeIndex === (this.employees.length - 1)) {
                // Go to the first employee 
                this.activeEmployeeIndex = 0;
                this.setActiveEmployee();
            } else {
                // Increment the employee index
                this.activeEmployeeIndex++;
                this.setActiveEmployee();
            }
            event.preventDefault()
        } else if (event.which === 38 || event.keyCode === 38) { // UP 
            if (this.activeEmployeeIndex === -1) {
                this.activeEmployeeIndex = this.employees.length - 1; 
                this.setActiveEmployee();
                return;
            }
            if (this.activeEmployeeIndex === 0) {
                // Go to the last employee 
                this.activeEmployeeIndex = this.employees.length - 1 ;
                this.setActiveEmployee();
            } else {
                // Decrement the suggestion index
                this.activeEmployeeIndex--;
                this.setActiveEmployee();
            }
            event.preventDefault();

        } else if ((event.which === 10 || event.which === 13 ||
                    event.keyCode === 10 || event.keyCode === 13) &&
                    this.activeEmployeeListVisible) { // ENTER

            let activeEmployee = this.getActiveEmployee(); 
            if (activeEmployee != "") {   // this is set if the user selected from the popup and hit return
                this.refreshSearch(activeEmployee); 
            } else {
                this.refreshSearch(this.aSearchBox);
            }
            this.employees = [];
            this.aSearchBox = ""
            this.activeEmployeeIndex = -1;
            this.setActiveEmployee();
            event.preventDefault()
        } else if (event.which == 27 || event.keyCode == 27) {   // esc
            // clear box
            this.employees = [];
            this.aSearchBox = ""
            this.activeEmployeeIndex = -1;
            this.setActiveEmployee();
            event.preventDefault()
        }
    }

    public setActiveEmployee(): void {
        this.activeEmployee = this.employees[this.activeEmployeeIndex];
    }

    public getActiveEmployee(): string {
        if (this.activeEmployeeIndex != -1) {
            return this.employees[this.activeEmployeeIndex];
        } else {
            return ""
        }
    }

}
