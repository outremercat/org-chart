import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { Employee } from './employee';
import { EmployeeRow } from './employee-row';


 

@Injectable()
export class EmployeeService {
    // loads employee data from json server and massages it so it can be displayed 

    private employeesUrl = 'http://vm-dan.dev.purestorage.com/org.json'
    private employeeById: {[key: string] : Employee} = {};        // map employee ID to Employee object
    private nameToId: {[key: string] : string} = {};              // map employee names to employee ID
    private nameToIdLower: {[key: string] : string} = {};         // map employee names (lower case) to employee ID
    private teamToManager: {[key: string]: Employee} = {};        // map team name to employee object (of the manager) 
    private employeeNames: Array<string> = [];                    // array containing all names
    private rootEmployee: string;
    public lastManagerChain: Array<Employee> = [];                // holds chain of managers, updated by createEmployeeTable


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
            if (emp.isManager()) {
                for (let team of emp.getTeamsManagedFullName()) {
                    this.teamToManager[team] = emp;
                }
            }
            empls.push(emp);

        } 

        // second pass to setup employee list for mgrs and to populate team map
        for (let empId in this.employeeById) {
            let emp : Employee = this.employeeById[empId];
            let mgrId : string = emp.getMgrId();

            if (mgrId in this.employeeById) {
                let mgr : Employee = this.employeeById[mgrId];
                if (emp.isManager()) {
                    mgr.addManager(emp);
                } else {
                    mgr.addIC(emp);
                }

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

    private areEmployeesInTeam(emplList: Array<Employee>, team: string): boolean {
        for (let empl of emplList) {
            if (empl.getTeam() == team) {
                return true;
            }
        }
        return false;
    }

    private areEmployeesInDifferentTeams(emplList: Array<Employee>): boolean {
        let myEmplList: Array<string> = [];
        for (let empl of emplList) {
            myEmplList.push(empl.getTeam());
        }
        for (let i = 1; i < myEmplList.length; i++) {
            if (myEmplList[i] != myEmplList[0]) {
                return true;
            }
        }
        return false;
    }

    private teamsAsString(teams: Array<string>): string {
        let teamNames = "";
        for (let aTeam of teams) {
            teamNames += (aTeam + ", ")
        }
        teamNames = teamNames.slice(0, -2);  // remove last ","
        return teamNames;
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

        let teamsEmitted: Array<string> = [];
        

        while(nextTeam = teamStack.pop() ){
            // prevent infinite loops
            if (teamsEmitted.indexOf(nextTeam.teamname) != -1) {
                break;
            }
            teamsEmitted.push(nextTeam.teamname);
            
            mgrObj = this.teamToManager[nextTeam.teamname];
            mgrId = mgrObj.getId();
            atLevel = nextTeam.level;

            // have we already emitted that manager?
            if (managersEmitted.indexOf(mgrId) == -1) {      // it's not in there
                // get the team(s) and prep that string
                let nextRow = { level: atLevel, team: this.teamsAsString(mgrObj.getTeamsManaged()), title: mgrObj.getTitle(), name: mgrObj.getFullName() };         
                empTable.push(nextRow);
                managersEmitted.push(mgrId);
            }

            atLevel++;   

            // emit the team if this manager manages more than one team
            if (mgrObj.getTeamsManagedFullName().length > 1) {
                let nextRow = { level: atLevel, team: nextTeam.teamname.split("(")[0].trim(), title: "", name: "" };         
                empTable.push(nextRow);
                atLevel++;
            }

            // sort managers decending, sort non-managers ascending - that way it will all
            // display in alphabetical order

            // sort decending  Z-A
            let managersTemp = mgrObj.getManagers(nextTeam.teamname);
            let icsTemp = mgrObj.getICs(nextTeam.teamname);

            managersTemp.sort(function(a,b) {return (a.getFullName() > b.getFullName()) ? -1 : 
                        ((b.getFullName() > a.getFullName()) ? 1 : 0);} ); 

            // sort ascending A-Z 
            icsTemp.sort(function(a,b) {return (a.getFullName() > b.getFullName()) ? 1 : 
                        ((b.getFullName() > a.getFullName()) ? -1 : 0);} ); 

            // emit all ICs in this team
            let anotherRow : EmployeeRow;  
            for (let empObj of icsTemp) {
                anotherRow = { level: atLevel, team: "", title: empObj.getTitle(), name: empObj.getFullName() };         
                empTable.push(anotherRow);
            }

            if (recursive) {
                // add teams to backqueue of teams 
                for (let empObj of managersTemp) {
                    let teamNames = empObj.getTeamsManagedFullName(); 
                    for (let teamName of teamNames) {
                        teamStack.push({teamname: teamName, level: atLevel});
                    }
                }
            } else {
                for (let empObj of managersTemp) {
                    anotherRow = { level: atLevel, team: "", title: empObj.getTitle(), name: empObj.getFullName() };         
                    empTable.push(anotherRow);
                }
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
   // creates the org chart
    public createEmployeeTableAboutToBeDeleted(rootManager : string, directsOnly: boolean): EmployeeRow[] {
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
        while(true) {
            let teams = mgrObj.getTeamsManagedFullName();
            // get the team(s) and prep that string
             let nextRow = { level: atLevel, team: this.teamsAsString(teams), title: mgrObj.getTitle(), name: mgrObj.getFullName() };         
            //console.log("Adding manager: " + mgrObj.getFullName());
            empTable.push(nextRow);
            atLevel += 1

            // loop over teams this manager is managing
            // create two lists - one with non-managers and one with managers
            // sort managers decending, sort non-managers ascending - that way it will all
            // display in alphabetical order
            let managersTemp: Array<Employee> = [];
            let nonManagersTemp: Array<Employee> = [];
            let empList = mgrObj.getManagers("abc");

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
            
            for (let aTeam of teams) {
                let showTeamLine: boolean = (teams.length > 1 && 
                    this.areEmployeesInTeam(nonManagersTemp, aTeam) && 
                    this.areEmployeesInDifferentTeams(nonManagersTemp));

                // if manager has more than one team, emit a line for that
                if (showTeamLine) {
                    let teamRow = { level: atLevel, team: aTeam, title: "", name: "" };         
                    empTable.push(teamRow);
                    atLevel++;
                }
               
                // emit rows for the leaves - these could still be managers if mode is directs only
                let anotherRow : EmployeeRow;  
                for (let empObj of nonManagersTemp) {
                    if (empObj.getTeam() == aTeam) {     
                        if (empObj.isManager()) {
                            anotherRow = { level: atLevel, team: this.teamsAsString(empObj.getTeamsManaged()), 
                                           title: empObj.getTitle(), name: empObj.getFullName() };         
                        } else {
                            anotherRow = { level: atLevel, team: "", title: empObj.getTitle(), name: empObj.getFullName() };         
                        }
                        empTable.push(anotherRow);
                    }
                }
                if (showTeamLine) {
                    atLevel -= 1;
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

}