import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { Employee } from './employee';
import { EmployeeRow } from './employee-row';

@Injectable()
export class EmployeeService {
    // loads employee data from json server and massages it so it can be displayed 

    private employeesUrl = 'http://vm-dan.dev.purestorage.com/org.json';
    private employeeById: {[key: string]: Employee} = {};        // map employee ID to Employee object
    private nameToId: {[key: string]: string} = {};              // map employee names to employee ID
    private nameToIdLower: {[key: string]: string} = {};         // map employee names (lower case) to employee ID
    private teamToManager: {[key: string]: Employee} = {};        // map team name to employee object (of the manager) 
    private employeeNames: Array<string> = [];                    // array containing all names
    private rootEmployee: string;
    public lastManagerChain: Array<Employee> = [];                // holds chain of managers, updated by createEmployeeTable
    public lastOrgSize: number;                                   // holds size of org, updated by createEmployeeTable
    public lastOrgSizeICs: number;                                // holds number of ICs (non managers) per org

    constructor(private http: Http) { }

    // fetches data from json server
    public getEmployees(rEmployee: string): any {
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
        let emplRows = this.createEmployeeTable(this.rootEmployee, false, false);
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
        let empls: Employee[] = [];
        for (let entry  of empsData) {
            let emp = new Employee(entry);

            // check if employee is legit (trying to exclude contractors)
            if (emp.getEmail() == undefined) {
                // no valid e-mail - don't include
                continue;
            }
            // if (emp.isContractor()) {
                // contractor - don't include
            //    continue;
            // }

            let employeeId = emp.getEmployeeId();

            this.employeeById[employeeId] = emp;
            this.nameToId[emp.getFullName()] = employeeId;
            this.nameToIdLower[emp.getFullName().toLowerCase()] = employeeId;
            if (emp.isManager()) {
                for (let team of emp.getTeamsManagedFullName()) {
                    this.teamToManager[team] = emp;
                }
            }
            empls.push(emp);

        }
        // second pass to setup employee list for mgrs and to populate team map
        // tslint:disable-next-line:forin
        for (let empId in this.employeeById) {
            let emp: Employee = this.employeeById[empId];
            let mgrId : string = emp.getMgrId();

            if (mgrId in this.employeeById) {
                let mgr : Employee = this.employeeById[mgrId];
                if (emp.isManager()) {
                    mgr.addManager(emp);
                } else {
                    mgr.addIC(emp);
                }
                // update teamToManager
                this.teamToManager[emp.getTeam()] = mgr;

            }
        }
        this.employeeNames = Object.keys(this.nameToId)
    }

    // updates the manager chain for a given employee
    private updateManagerChain(empId: Employee) : void {
        // get manager chain
        this.lastManagerChain = [];
        let mgrObj = empId;
        while (mgrObj && !(mgrObj.isCEO())) {
            mgrObj = this.employeeById[mgrObj.getMgrId()];
            this.lastManagerChain.push(mgrObj);
        } 
        this.lastManagerChain.reverse();

    }

    private teamsAsString(teams: Array<string>): string {
        let teamNames = '';
        for (let aTeam of teams) {
            teamNames += (aTeam + ', ');
        }
        teamNames = teamNames.slice(0, -2);  // remove last ","
        return teamNames;
    }

    // creates the org chart
    public createEmployeeTable(rootManager: string, directsOnly: boolean, includeContractors: boolean): EmployeeRow[] {
        // create an array of EmployeeRow where each row looks as follows:
        //    name, title, team, level
        // 'team' is set only for the manager of the team
        // 'level' is 0 for the rootManager and increments based on the position of the 
        //    person in the org
        let empTable: EmployeeRow[] = [];
        let atLevel = 0;

        let mgrId = this.nameToIdLower[rootManager.toLowerCase()];
        let mgrObj: Employee = this.employeeById[mgrId];
        let empObj: Employee;

        let teamStack: Array<{ teamname: string, level: number}> = [];   // stack that holds the teams

        if (!mgrObj) {   // not a valid object -> clear manager chain and exit
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

        // push this manager's teams onto the stack
        for (let team of mgrObj.getTeamsManagedFullName()) {
            teamStack.push({teamname: team, level: atLevel});
        }

        let nextTeam: {teamname : string, level: number};
        let managersEmitted: Array<string> = [];

        this.lastOrgSize = 0;
        this.lastOrgSizeICs = 0;

        while (nextTeam = teamStack.pop() ) {

            mgrObj = this.teamToManager[nextTeam.teamname];
            mgrId = mgrObj.getId();
            atLevel = nextTeam.level;

            // have we already emitted that manager?
            if (managersEmitted.indexOf(mgrId) === -1) {      // it's not in there
                // get the team(s) and prep that string
                let nextRow = { level: atLevel,
                                team: this.teamsAsString(mgrObj.getTeamsManaged()),
                                title: mgrObj.getTitle(), name: mgrObj.getFullName() };
                empTable.push(nextRow);
                managersEmitted.push(mgrId);
                this.lastOrgSize++;
            }

            atLevel++;

            // emit the team if this manager manages more than one team
            if (mgrObj.getTeamsManagedFullName().length > 1) {
                let nextRow = { level: atLevel, team: nextTeam.teamname.split('(')[0].trim(), title: '', name: '' };
                empTable.push(nextRow);
                atLevel++;
            }

            // sort managers depending on whether we do it recursively, sort non-managers ascending - that way it will all
            // display in alphabetical order
            // sort decending  Z-A
            let managersTemp = mgrObj.getManagers(nextTeam.teamname);
            let icsTemp = mgrObj.getICs(nextTeam.teamname);

            if (recursive) {
                managersTemp.sort(function(a,b) {return (a.getFullName() > b.getFullName()) ? -1 :
                        ((b.getFullName() > a.getFullName()) ? 1 : 0); } );
            } else {
                managersTemp.sort(function(a,b) {return (a.getFullName() > b.getFullName()) ? 1 :
                        ((b.getFullName() > a.getFullName()) ? -1 : 0); } );
            }

            // sort ascending A-Z 
            icsTemp.sort(function(a,b) {return (a.getFullName() > b.getFullName()) ? 1 :
                        ((b.getFullName() > a.getFullName()) ? -1 : 0); } );

            // emit all ICs in this team
            let anotherRow: EmployeeRow;
            for (empObj of icsTemp) {
                if (!includeContractors && empObj.isContractor()) {
                    continue;
                }
                anotherRow = { level: atLevel, team: '', title: empObj.getTitle(), name: empObj.getFullName() };
                empTable.push(anotherRow);
                this.lastOrgSize++;
                this.lastOrgSizeICs++;
            }

            if (recursive) {
                // add teams to backqueue of teams 
                for (empObj of managersTemp) {
                    let teamNames = empObj.getTeamsManagedFullName();
                    for (let teamName of teamNames) {
                        // Dietz reports to himself
                        if (!empObj.isCEO()) {
                            teamStack.push({teamname: teamName, level: atLevel});
                        }
                    }
                }
            } else {
                for (empObj of managersTemp) {
                    if (!includeContractors && empObj.isContractor()) {
                        continue;
                    }
                    if (!empObj.isCEO()) {
                        let teams = empObj.getTeamsManaged();
                        anotherRow = { level: atLevel,
                                       team: this.teamsAsString(teams),
                                       title: empObj.getTitle(), name: empObj.getFullName() };
                        empTable.push(anotherRow);
                        this.lastOrgSize++;
                    }
                }
            }
        }
        return empTable;
    }


    // returns a sorted list of names that match a pattern (case-insensitive)
    public searchCandidates (pattern: string): Array<string> {
        if (pattern == null || pattern === undefined) {
            return [];
        }
        let candidates: Array<string> = [];
        let candCount = 0;
        pattern = pattern.toLowerCase();
        for (let cand of this.employeeNames) {
            if(cand.toLowerCase().indexOf(pattern) !== -1) {
                candidates.push(cand);
                candCount++;
                if (candCount === 20) {
                    break;
                }
            }
        } 
        // sort
        return candidates.sort();
    }

    public getEmployee(empName: string): Employee {
        return this.employeeById[this.nameToId[empName]];
    }
}