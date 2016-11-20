import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable }        from 'rxjs/Observable';
import { Subject }           from 'rxjs/Subject';

import { EmployeeSearchService } from './employee-search.service';

@Component({
    moduleId: module.id,
    selector: 'employee-search',
    templateUrl: 'employee-search.component.html',
    styleUrls: [ 'employee-search.component.css' ],
    providers: [EmployeeSearchService]
})

export class EmployeeSearchComponent implements OnInit {
   @Input() searchTerm : string;   // this is the root search term
   @Output() onNewSearchTerm = new EventEmitter<string>();

    employees: Observable<string[]>;
    private searchTerms = new Subject<string>();

    constructor (private employeeSearchService: EmployeeSearchService) {}
      
    // Push a search term into the observable stream.
    search(term: string): void {
        this.searchTerms.next(term);
    }


    ngOnInit(): void {
        this.employees= this.searchTerms
            .debounceTime(0)        // wait for 300ms pause in events
            .distinctUntilChanged()   // ignore if next search term is same as previous
            .switchMap(term => term   // switch to new observable each time
                // return the http search observable
                ? this.employeeSearchService.search(term)
                // or the observable of empty heroes if no search term
                : Observable.of<string[]>([]))
            .catch(error => {
                // TODO: real error handling
                console.log(error);
                return Observable.of<string[]>([]);
            });
    }
    
    refreshSearch(empl: string): void {
        console.log("Search string:" + empl)           
        this.onNewSearchTerm.emit(empl)
    }
}
