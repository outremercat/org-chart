import { Component, ViewChild } from '@angular/core';

@Component({
    moduleId: module.id,
    selector: 'my-app',
    templateUrl: 'app.component.html', 
    styleUrls: [ 'app.component.css' ]  
})
export class AppComponent {

    searchTerm : string = "Scott \"Dietz\" Dietzen";
    directsOnly: boolean = false;
    
    updateSearchTerm(newTerm: string) {
        this.searchTerm = newTerm;
    }

    updateDirectsOnly(newDirectsOnly: boolean) {
        this.directsOnly = newDirectsOnly;
    }

    doAll() {
        this.searchTerm = "Scott \"Dietz\" Dietzen"; 
    }

    doEng() {
        this.searchTerm = "Bob Wood";
    }

    doSupport() {
        this.searchTerm = "Colin Mead";
    }

    doFinance() {
        this.searchTerm = "Timothy Riitters";
    }
    doGlobalSales() {
        this.searchTerm = "David \"Hat\" Hatfield";
    }
    doCTO() {
        this.searchTerm = "John \"Coz\" Colgrove";
    }
    doOps() {
        this.searchTerm = "Todd Engle";
    }
    doProducts() {
        this.searchTerm = "Matthew \"Kix\" Kixmoeller";
    }
    doMarketing() {
        this.searchTerm = "Jonathan Martin";
    }
 }
