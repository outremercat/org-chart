import { Injectable }     from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { EmployeeRow }           from './employee-row';

@Injectable()
export class EmployeeSearchService {

  constructor() {}
  
  search(term: string): Observable<EmployeeRow[]> {
    return Observable.of<EmployeeRow[]>([])
  }
}
