import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { Employee } from './employee';
import { EmployeeRow } from './employee-row';

@Injectable()
export class EmployeeService {
    // loads employee data from json server and massages it so it can be displayed 

    private employeesUrl = 'http://vm-dan.dev.purestorage.com/org.json'
    private employeeById: {[key: string] : Employee} = {}        // map employee ID to Employee object
    private nameToId: {[key: string] : string} = {}              // map employee names to employee ID
    private nameToIdLower: {[key: string] : string} = {}         // map employee names (lower case) to employee ID
    private employeeNames: Array<string> = [];                   // array containing all names
    private rootEmployee: string;
    public lastManagerChain: Array<Employee> = [];                    // holds chain of managers, updated by createEmployeeTable

    constructor(private http: Http) { }

    // fetches data from json server
    getEmployees(rEmployee : string): Promise<EmployeeRow[]> {
        this.rootEmployee = rEmployee; 
        return this.http.get(this.employeesUrl)
                    .toPromise()
                    .then(this.extractData)
                    .catch(this.handleError);
    }

    // parses json and creates the org chart table
    private extractData= (res: Response) => {
        // server response contains an array of entries as follows: "Report_Entry" : [ rec1, rec2, ...] 
        let body = res.json();
        let empsData = body['Report_Entry'];
        this.parseJson(empsData);
        let emplRows = this.createEmployeeTable(this.rootEmployee, false);
        return emplRows;
    }

    // handles errors in case the server request fails
    private handleError (error: Response | any): Promise<void> {
        let errMsg: string;
        if (error instanceof Response) {
            const body = error.json() || '';
            const err = body.error || JSON.stringify(body);
            errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.error(errMsg);
        return Promise.reject(errMsg);
    }


    // parses json data from the server into a set of data structure that make it easy to 
    // build the org chart
    private parseJson(empsData : [[{[key: string] : string}]]): void {
       // map to objects
        let empls : Employee[] = [];
        let count : number = 0;
        for (let entry  of empsData) {
            let emp = new Employee(entry);
            let employeeId = emp.getEmployeeId();

            this.employeeById[employeeId] = emp;
            this.nameToId[emp.getFullName()] = employeeId;
            this.nameToIdLower[emp.getFullName().toLowerCase()] = employeeId;
            
            empls.push(emp);

        } 

        // second pass to setup employee list for mgrs and to populate team map
        for (let empId in this.employeeById) {
            let emp : Employee = this.employeeById[empId];
            let mgrId : string = emp.getMgrId();

            if (mgrId in this.employeeById) {
                let mgr : Employee = this.employeeById[mgrId];
                mgr.addEmployee(emp)
            }
        }
        this.employeeNames = Object.keys(this.nameToId)
    }

    // updates the manager chain for a given employee
    private updateManagerChain(empId: Employee) : void {
        // get manager chain
        this.lastManagerChain = [];
        let mgrObj = empId;
        while (mgrObj && !(mgrObj.isScott())) {
            mgrObj = this.employeeById[mgrObj.getMgrId()];
            this.lastManagerChain.push(mgrObj);
        } 
        this.lastManagerChain.reverse();

    }
    
    // creates the org chart
    public createEmployeeTable(rootManager : string, directsOnly: boolean): EmployeeRow[] {
        // create an array of EmployeeRow where each row looks as follows:
        //    name, title, team, level
        // 'team' is set only for the manager of the team
        // 'level' is 0 for the rootManager and increments based on the position of the 
        //    person in the org
        let empTable: EmployeeRow[] = [];
        let atLevel = 0;
        
        let mgrId = this.nameToIdLower[rootManager.toLowerCase()]
        let subMgrs: Employee[] = [];
        let mgrObj: Employee = this.employeeById[mgrId];
        let empObj: Employee; 
        if (!mgrObj) {
            this.updateManagerChain(null);
            return [];
        }
        // update manager chain
        this.updateManagerChain(mgrObj); 
   
        let recursive = !directsOnly;
        // if this is not a manager, get their manager
        if (!mgrObj.isManager()) {
            mgrId = mgrObj.getMgrId();
            mgrObj = this.employeeById[mgrId];
            recursive = false;
            this.lastManagerChain.pop();
        }
        let rowCount : number = 0;

        while(true) {
            //console.log("Row count: " + rowCount)
            let nextRow = { level: atLevel, team: mgrObj.getTeam(), title: mgrObj.getTitle(), name: mgrObj.getFullName() };         
            //console.log("Adding manager: " + mgrObj.getFullName());
            rowCount++;
            empTable.push(nextRow);
            let empList = mgrObj.getEmployees();

            atLevel += 1
            // sort empList
            // create two lists - one with non-managers and one with managers
            // sort managers decending, sort non-managers ascending - that way it will all
            // display in alphabetical order
            let managersTemp: Array<Employee> = [];
            let nonManagersTemp: Array<Employee> = [];
            for (let empObj of empList) { 
                if(empObj!= mgrObj) {
                    if (empObj.isManager() && recursive) {
                        empObj.level = atLevel;
                        managersTemp.push(empObj);
                    } else {
                        nonManagersTemp.push(empObj);
                    }
                }    
            }
            // sort decending  Z-A
            managersTemp.sort(function(a,b) {return (a.getFullName() > b.getFullName()) ? -1 : 
                         ((b.getFullName() > a.getFullName()) ? 1 : 0);} ); 

            // sort ascending A-Z 
            nonManagersTemp.sort(function(a,b) {return (a.getFullName() > b.getFullName()) ? 1 : 
                         ((b.getFullName() > a.getFullName()) ? -1 : 0);} ); 

            // add managers to backqueue of managers
            for (let empObj of managersTemp) { 
                subMgrs.push(empObj);
            }

            // emit rows for the leaves - these could still be managers if mode is directs only
            let anotherRow : EmployeeRow;  
            for (let empObj of nonManagersTemp) {
                if (empObj.isManager()) {
                    anotherRow = { level: atLevel, team: empObj.getTeam() , title: empObj.getTitle(), name: empObj.getFullName() };         
                } else {
                    anotherRow = { level: atLevel, team: "", title: empObj.getTitle(), name: empObj.getFullName() };         
                }
                rowCount++
                empTable.push(anotherRow);
            }

            if (recursive) {
                if (subMgrs.length > 0) {
                    mgrObj = subMgrs.pop();
                    atLevel = mgrObj.level;
                } else {
                    break;
                }
            } else {
                break;
            } 
        }

        return empTable;
    }

      private getNameFromId(empId: string): string {
        return this.employeeById[empId].getFullName()
    }

    // returns a sorted list of names that match a pattern (case-insensitive)
    searchCandidates (pattern : string): Array<string> {
        if (pattern == null || pattern == undefined) {
            return [];
        }

        let candidates : Array<string> = []
        let candCount = 0;
        pattern = pattern.toLowerCase()
        for (let cand of this.employeeNames) {
            if(cand.toLowerCase().indexOf(pattern) != -1) {
                candidates.push(cand);
                candCount++;
                if (candCount == 20) {
                    break;
                }
            }
        } 
        // sort
        return candidates.sort();
    }

}