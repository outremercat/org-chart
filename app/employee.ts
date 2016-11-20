export class Employee {

    private mydata: [{[key: string] : string}] = [{}];
    private employeeList: [any];
    level : number;

    constructor(mdata: [{[key: string] : string}]) {
        this.mydata = mdata;
        this.employeeList = <any>[]
    }

    getFullName() {
        return this.mydata['CF_First_Last_Name'];
    }

    getCostCenterHierarchy() {
        return this.mydata['Cost_Center_Hierarchy'];
    }

    getCostCenterName() {
        return this.mydata['Cost_Center_-_Name'];
    }    

    getId() {
        return this.mydata['Employee_ID'];
    }

    isManager() {
        return (this.mydata['isManager'] == "1");
    }

    isDirector() {
        return this.mydata['businessTitle'].startsWith('Director')
    }

    isVP() {
        return this.mydata['businessTitle'].startsWith('VP')
    }

    getEmployeeId() {
        return this.mydata['Employee_ID'];
    } 

    getEmail() {
        return this.mydata['primaryWorkEmail'];
    }

    getMgrId() {
        return this.mydata['Manager_ID'];
    }

    getMgrName() {
        return this.mydata['Manager'];
    }
        
    getTeam() {
        // chop of the person's name which seems to appear in the team name
        if ('supervisoryOrganizationsManaged' in this.mydata) {
            return (this.mydata['supervisoryOrganizationsManaged'].split("(")[0].trim());
        } else {
            return "";
        }
    }

    getEmployees() {
        return this.employeeList;
    }

    getTitle() {
        return this.mydata['businessTitle'];
    }

    inBobOrg() {
        // Only get folks in Bob's reporting chain """
        if (this.getCostCenterHierarchy() != '40000 Engineering' && 
                this.getCostCenterHierarchy() != '70000 Iridium') {
            return false;
        }
        if (this.getCostCenterHierarchy() == '70000 Iridium') {
            if (this.getCostCenterName() != 'Iridium') {
                return false;
            }
        }
        return true
    }

    notEngineer() {
        return (this.mydata['businessTitle'] == 'Office Manager');
    }

    reportsToCoz() {
        return (this.mydata['Manager'] == 'John "Coz" Colgrove'); 
    }

    isBob() {
        (this.getFullName() == "Rober Wood" || this.getFullName() == "Bob Wood")
    }

    addEmployee(employeeId : string) {
        this.employeeList.push(employeeId)
    }
}