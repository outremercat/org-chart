export class Employee {

    private mydata: [{[key: string] : string}] = [{}];
    private icList: Array<Employee>;
    private managerList: Array<Employee>;
    level : number;
    private teamList: Array<String>;                 // list of teams this person is in or manages 

    constructor(mdata: [{[key: string] : string}]) {
        this.mydata = mdata;
        this.icList = [];
        this.managerList = [];
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

    getEmailPrefix(): string {
        if ('primaryWorkEmail' in this.mydata) {
            return this.mydata['primaryWorkEmail'].replace("purestorage.com","");
        } else {
            return "";
        }
    }

    getMgrId(): string {
        return this.mydata['Manager_ID'];
    }

    getMgrName(): string {
        return this.mydata['Manager'];
    }

    getPhoneNumber(): string {
        return this.mydata['primaryWorkPhone'];
    }
        
    getHireDate(): string {
        let dateSplit = this.mydata['Hire_Date'].split("-"); 
        return dateSplit[1]+"/"+dateSplit[2]+"/"+dateSplit[0];
    }

    getWorkAddress() : Array<string> {
        let addressSplit = this.mydata['Full_Work_Address'].split("&#xa;");
        return addressSplit;

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

   getTeamsManagedFullName(): Array<string> {
        // comes from workday as follows: "supervisoryOrganizationsManaged": "Dedup (Salil Gokhale); DB Res (Salil Gokhale)"
        // without the person's name the team names are not unique - so we need to keep that 
        let teams: Array<string> = [];

        if ('supervisoryOrganizationsManaged' in this.mydata) {
            let tList: Array<string> = this.mydata['supervisoryOrganizationsManaged'].split(";");
            for (let aTeam of tList) {
                if (!aTeam.includes("(inactive)")) {
                    if(teams.indexOf(aTeam.trim()) == -1) {
                        teams.unshift(aTeam.trim());
                    }      
                }
            }
            // sometimes managers inherit a team - those need to be added as well - check the IC list
            for (let aIC of this.icList) {
                if (teams.indexOf(aIC.getTeam()) == -1)  {
                    teams.unshift(aIC.getTeam()); 
                }
            }
            return teams;
        } else {
            return [];
        }
    }


    getTeam(): string {
        return this.mydata['Supervisory_Organization'].replace(" (Inherited)", "").trim();
    }

    private getEmployees(empList: Array<Employee>, teamName: string) {
        let theList: Array<Employee> = [];
        for (let employee of empList) {
            if (employee.getTeam() == teamName) {
                theList.push(employee);
            }
        }
        return theList;

    }

    getICs(teamName: string): Array<Employee> {
        return this.getEmployees(this.icList, teamName);
    }

    getManagers(teamName: string): Array<Employee> {
        return this.getEmployees(this.managerList, teamName);
    }

    getTitle(): string {
        return this.mydata['businessTitle'];
    }

    isContractor(): boolean {
        return (this.mydata['Worker_Type'] !== "Employee")
    }

    isScott(): boolean {
        return (this.getFullName() == "Scott \"Dietz\" Dietzen")
    }

    addIC(employee : Employee) : void {
        this.icList.push(employee)
    }

    addManager(employee : Employee) : void {
        this.managerList.push(employee)
    }
}