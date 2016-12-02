export class Employee {

    private mydata: [{[key: string] : string}] = [{}];
    private employeeList: Array<Employee>;
    level : number;
    private teamList: Array<String>;                 // list of teams this person is in or manages 

    constructor(mdata: [{[key: string] : string}]) {
        this.mydata = mdata;
        this.employeeList = [];
    }

    getFullName(): string {
        return this.mydata['CF_First_Last_Name'];
    }

    getCostCenterHierarchy(): string {
        return this.mydata['Cost_Center_Hierarchy'];
    }

    getCostCenterName(): string {
        return this.mydata['Cost_Center_-_Name'];
    }    

    getId(): string {
        return this.mydata['Employee_ID'];
    }

    isManager(): boolean {
        return (this.mydata['isManager'] == "1");
    }

    getEmployeeId(): string {
        return this.mydata['Employee_ID'];
    } 

    getEmail(): string {
        return this.mydata['primaryWorkEmail'];
    }

    getMgrId(): string {
        return this.mydata['Manager_ID'];
    }

    getMgrName(): string {
        return this.mydata['Manager'];
    }
        
    getTeamsManaged(): Array<string> {
        // comes from workday as follows: "supervisoryOrganizationsManaged": "Dedup (Salil Gokhale); DB Res (Salil Gokhale)"
        let teams: Array<string> = [];

        if ('supervisoryOrganizationsManaged' in this.mydata) {
            let tList: Array<string> = this.mydata['supervisoryOrganizationsManaged'].split(";");
            for (let aTeam of tList) {
                if (!aTeam.includes("(inactive)")) {
                    teams.push(aTeam.split("(")[0].trim());
                }
            }
            return teams;
        } else {
            return [];
        }
    }

    getTeam(): string {
        return this.mydata['Supervisory_Organization'].split("(")[0].trim();
    }

    getEmployees(): Array<Employee> {
        return this.employeeList;
    }

    getTitle(): string {
        return this.mydata['businessTitle'];
    }

    isScott(): boolean {
        return (this.getFullName() == "Scott \"Dietz\" Dietzen")
    }

    addEmployee(employee : Employee) : void {
        this.employeeList.push(employee)
    }
}