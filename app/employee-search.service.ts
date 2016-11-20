import { Injectable }     from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class EmployeeSearchService {

  constructor() {}
  
  search(term: string): Observable<string[]> {
    console.log(term)
    return Observable.of<string[]>(["Bob Wood", "Dan Decasper"])
  }
}
