import { Component } from '@angular/core';

@Component({
    selector: 'my-app',
    template: `<h2>Pure Org</h2>
               <employee-search (onNewSearchTerm)="onNewSearchTerm($event)"></employee-search>
               <employee-list  [searchTerm]="searchTerm"> </employee-list>
               `
})
export class AppComponent {
    searchTerm : string = "Dan Decasper";

    onNewSearchTerm(newTerm: string) {
        this.searchTerm = newTerm;
    }
    
 }
