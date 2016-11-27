export class Employee {

    private mydata: [{[key: string] : string}] = [{}];
    private employeeList: Array<Employee>;
    level : number;

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
        
    getTeam(): string {
        // chop of the person's name which seems to appear in the team name
        if ('supervisoryOrganizationsManaged' in this.mydata) {
            return (this.mydata['supervisoryOrganizationsManaged'].split("(")[0].trim());
        } else {
            return "";
        }
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