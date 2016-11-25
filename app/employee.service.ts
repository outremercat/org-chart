import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { Employee } from './employee';
import { EmployeeRow } from './employee-row';

@Injectable()
export class EmployeeService {

    private employeesUrl = 'http://vm-dan.dev.purestorage.com/org.json'
    private employeeById: {[key: string] : Employee} = {}       // map employee ID to Employee object
    private nameToId: {[key: string] : string} = {}      // map employee names to employee ID
    private nameToIdLower: {[key: string] : string} = {}      // map employee names (lower case) to employee ID
    private emailToId: {[key: string] : string} = {}     // map e-mail address to employee ID
    private idToTeam: {[key: string] : string} = {}      // map employee ID to team names
    private engTeamtoId: {[key: string] : string} = {}   // map team to manager ID 
    private employeeNames: Array<string> = [];           // array containing all names
    private rootEmployee: string;

    public lastManagerChain: Array<any> = [];            // holds chain of managers, updated by createEmployeeTable

    constructor(private http: Http) { }

    getEmployees(rEmployee : string): Promise<EmployeeRow[]> {
        this.rootEmployee = rEmployee; 
        return this.http.get(this.employeesUrl)
                    .toPromise()
                    .then(this.extractData)
                    .catch(this.handleError);
    }


    private extractData= (res: Response) => {
        // server response contains an array of entries as follows: "Report_Entry" : [ rec1, rec2, ...] 
        let body = res.json();
        let empsData = body['Report_Entry'];
        this.parseJson(empsData);
        let emplRows = this.createEmployeeTable(this.rootEmployee, false);
        return emplRows;
    }

    private parseJson(empsData : [any]){
       // map to objects
        let empls : Employee[] = [];
        let count : number = 0;
        for (let entry of empsData) {
            let emp = new Employee(entry);

            // skip anyone not in Bob's group
            /*
            if (!emp.inBobOrg() || emp.notEngineer()) {
                continue;
            }*/

            let employeeId = emp.getEmployeeId();

            if (emp.isManager()) {
                this.addEmployeeToTeam(emp.getTeam(), employeeId);
            }

            this.employeeById[employeeId] = emp;
            this.nameToId[emp.getFullName()] = employeeId;
            this.nameToIdLower[emp.getFullName().toLowerCase()] = employeeId;
            this.emailToId[emp.getEmail()] = employeeId;
            
            empls.push(emp);

        } 

        // second pass to setup employee list for mgrs and to populate team map
        for (let empId in this.employeeById) {
            let emp : Employee = this.employeeById[empId];
            /*if (emp.reportsToCoz() || emp.isBob()) {
                continue;
            } */
            let mgrId : string = emp.getMgrId();

            if (mgrId in this.employeeById) {
                let mgr : Employee = this.employeeById[mgrId];
                mgr.addEmployee(empId)
            }
        }
        this.employeeNames = Object.keys(this.nameToId)
    }

    private addEmployeeToTeam(teamString: any, employeeId: any) {
        this.engTeamtoId[teamString] = employeeId;
        this.idToTeam[employeeId] = teamString;
    }

    private handleError (error: Response | any) {
        // In a real world app, we might use a remote logging infrastructure
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
    public createEmployeeTable(rootManager : string, directsOnly: boolean) {
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
            atLevel += 1;
            for (let empId of empList) { 
                empObj = this.employeeById[empId];
                if (empObj.isManager() && recursive && empObj != mgrObj) {
                    empObj.level = atLevel;
                    subMgrs.push(empObj);
                } else {
                    let anotherRow = { level: atLevel, team: "", title: empObj.getTitle(), name: empObj.getFullName() };         
                    //console.log("Adding employee: " + empObj.getFullName());
                    rowCount++
                    empTable.push(anotherRow);
                }
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


    private getEmployeeTeamById(employeeId: string) {
        let employee: Employee = this.employeeById[employeeId];
        if (employee.isManager()) {
            return employee.getTeam();
        }
        let mgrId = employee.getMgrId()
        return this.idToTeam[mgrId]
    }

    private getNameFromId(empId: string) {
        return this.employeeById[empId].getFullName()
    }

    searchCandidates (pattern : string) {
        console.log("searchCandidates: " + pattern)
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