let mysql = require("mysql");
let inquirer = require("inquirer");

let connection = mysql.createConnection({
  host: "localhost",

 // PORT 
  port: 3306,

  
  user: "root",

  
  password: "",
  database: "employeeDB"
});
// Connection and displaying console log interface
connection.connect(function (err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId);
  console.log("********************************************\n")
  console.log("*                                          *\n")
  console.log("*             Employee Manager             *\n")
  console.log("*                                          *\n")
  console.log("********************************************")
  start();
});
// Prompt List
function start() {
  inquirer.prompt([
    {
      type: "list",
      name: "task",
      message: "What would you like to do?",
      choices: ["View All Employees", "View Employees By Department", "Add New Employee", "Update Employee Role", "Delete Employee", "View All Departments", "Add New Department", "View All Employee Roles", "Add New Employee Roles", "Exit"]
    }
  ])
  // Switch Function for choice 
    .then(function ({ task }) {
      switch (task) {
        case "View All Employees":
          viewEmployees();
          break;
        case "View Employees By Department":
          viewEmployeesDept();
          break;
        case "Add New Employee":
          addEmployee();
          break;
        case "Update Employee Role":
          updateEmployeeRole()
          break;
        case "Delete Employee":
          deleteEmployee();
          break;
        case "View All Departments":
          viewDepartments();
          break;
        case "Add New Department":
          addDepartment();
          break;
        case "View All Employee Roles":
          viewRoles();
          break;
        case "Add New Employee Roles":
          addRole();
          break;
        case "Exit":
          connection.end();
          break;
        default:
          connection.end();
          break;
      }
    })

}
// View employees function called in switch
function viewEmployees() {
  let query = "select employee.id, employee.first_name, employee.last_name, employee_role.title, department.name as 'Department', employee_role.salary, (select concat(employee.first_name, employee.last_name) from employee where employee.manager_id = employee.id ) as 'Manager' from employee join employee_role on employee.role_id = employee_role.id join department on department.id = employee_role.department_id;";
  connection.query(query, function (err, res) {
    if (err) throw err
    for (i = 0; i < res.length; i++) {
      console.table(res[i])
    }
    start();
  })
}
// View by department
function viewEmployeesDept() {
  connection.query("select * from department", function (err, res) {
    if (err) throw err
    let matchingValues = [];
    for (j = 0; j < res.length; j++) {
      matchingValues.push(res[j].name)
    }
    // Prompt
    inquirer.prompt([
      {
        type: "list",
        name: "department",
        message: "Select a department to view employees",
        choices: matchingValues
      }
    ])
    // Connecting query
      .then(function ({ department }) {
        let query = "select employee.id, employee.first_name, employee.last_name, employee_role.title, department.name as 'Department', employee_role.salary, (select concat(employee.first_name, employee.last_name) from employee where employee.manager_id = employee.id ) as 'Manager' from employee join employee_role on employee.role_id = employee_role.id join department on department.id = employee_role.department_id where department.name = ?"
        connection.query(query, [department], function (err, res) {
          if (err) throw err
          for (i = 0; i < res.length; i++) {
            console.table(res[i])
          }
          start();
        })
      })
  })
};
// Add a new employee
function addEmployee() {
  connection.query("select title from employee_role", function (err, res) {
    if (err) throw err
    let title = [];
    for (j = 0; j < res.length; j++) {
      title.push(res[j].title)
    }
    connection.query("select first_name, last_name from employee", function (err, res) {
      let managerName = ["none"]
      if (err) throw err
      for (k = 0; k < res.length; k++) {
        let firstname = res[k].first_name;
        let lastname = res[k].last_name
        console.table(firstname + lastname)
        managerName.push(firstname + " " + lastname)
      }
      console.table(title)
      console.table(managerName)
      inquirer.prompt([
        {
          type: "input",
          name: "firstName",
          message: "What is the employee's first name?"
        },
        {
          type: "input",
          name: "lastName",
          message: "What is the employee's last name?"
        },
        {
          type: "list",
          name: "title",
          message: "What is this employee's role?",
          choices: title
        },
        {
          type: "list",
          name: "manager",
          message: "Who is this employee's manager?",
          choices: managerName
        }
      ])
      // Connection query
        .then(function ({ firstName, lastName, title, manager }) {
          console.table(manager)
          connection.query("Select id from employee_role where title = ?", [title], function (err, res) {
            if (err) throw err;
            let roleId = res[0].id;
            let managerId;
            if (manager === "none") {
              managerId = null
              connection.query("Insert into employee(first_name, last_name, role_id, manager_id) values(?, ?, ?, ?)", [firstName, lastName, roleId, managerId], function (err, res) {
                if (err) throw err;
                console.table(res);
                start();
              })
            }
            else {
              let managersName = manager.split(" ");
              connection.query("Select id from employee where (first_name = ? and last_name = ?)", [managersName[0], managersName[1]], function (err, res) {
                if (err) throw err;
                console.table(res[0].id)
                managerId = res[0].id;
                console.table(firstName);
                console.table(lastName);
                console.table(roleId);
                console.table(managerId);
                connection.query("Insert into employee(first_name, last_name, role_id, manager_id) values(?, ?, ?, ?)", [firstName, lastName, roleId, managerId], function (err, res) {
                  if (err) throw err;
                  console.table(res);
                  start();
                })
              })
            }
          })
        })
    })
  })
};
// Delete employee
function deleteEmployee() {
  connection.query("select first_name, last_name from employee", function (err, res) {
    let name = []
    if (err) throw err
    for (k = 0; k < res.length; k++) {
      let firstname = res[k].first_name;
      let lastname = res[k].last_name
      console.table(firstname + lastname)
      name.push(firstname + " " + lastname)
    }

    inquirer.prompt([
      {
        type: "list",
        name: "employee",
        message: "Select the employee you would like to delete",
        choices: name
      }
    ])
      .then(function ({ employee }) {
        let selectedName = employee.split(" ");
        connection.query("select id from employee where (first_name = ? and last_name = ?)", [selectedName[0], selectedName[1]], function (err, res) {
          if (err) throw err
          console.table(res[0].id)
          connection.query("delete from employee where id = ?", [res[0].id], function (err, res) {
            if (err) throw err
            console.table(res);
            start();
          })
        })
      })
  })
}
// Add department 
function addDepartment() {
  inquirer.prompt([
    {
      type: "input",
      name: "department",
      message: "Input the name of the new department"
    }
  ])
  // Connection query
    .then(function ({ department }) {
      connection.query("insert into department(name) values (?)", [department], function (err, res) {
        if (err) throw err
        console.table(res)
        start();
      })
    })
}
// View departments and connection query
function viewDepartments() {
  connection.query("select * from department", function (err, res) {
    if (err) throw err
    for (i = 0; i < res.length; i++) {
      console.table(res[i])
    }
    start();
  })
}
// View roles and connection query
function viewRoles() {
  connection.query("select * from employee_role", function (err, res) {
    if (err) throw err
    for (i = 0; i < res.length; i++) {
      console.table(res[i])
    }
    start();
  })
}
// Add a role and connection query
function addRole() {
  connection.query("select name from department", function (err, res) {
    if (err) throw err
    deptName = [];
    for (i = 0; i < res.length; i++) {
      deptName.push(res[i].name)
    }
    inquirer.prompt([
      {
        type: "input",
        name: "role",
        message: "Input the title of the new role"
      },
      {
        type: "input",
        name: "salary",
        message: "Input the salary of the new role"
      },
      {
        type: "list",
        name: "department",
        message: "Assign this role to a department",
        choices: deptName
      }
    ])
      .then(function ({ role, salary, department }) {
        connection.query("select id from department where name = ?", [department], function (err, res) {
          if (err) throw err
          let deptId = res[0].id
          connection.query("insert into employee_role(title, salary, department_id) values (?, ?, ?)", [role, salary, deptId], function (err, res) {
            if (err) throw err
            console.table(res)
            start();
          })
        })
      })
  })
}
// Update and connection
function updateEmployeeRole() {
  connection.query("select title from employee_role", function (err, res) {
    if (err) throw err
    let role = []
    let employee2 = []
    for (i = 0; i < res.length; i++) {
      role.push(res[i].title)
    }
    connection.query("select first_name, last_name from employee", function (err, res) {
      if (err) throw err
      for (j = 0; j < res.length; j++) {
        let firstname = res[j].first_name;
        let lastname = res[j].last_name
        console.table(firstname + lastname)
        employee2.push(firstname + " " + lastname)
      }
      inquirer.prompt([
        {
          type: "list",
          name: "pickedEmployee",
          message: "Choose an employee to update their role",
          choices: employee2
        },
        {
          type: "list",
          name: "newRole",
          message: "Choose a new role for this employee",
          choices: role
        }
      ])
      .then(function({pickedEmployee, newRole}){
        connection.query("select id from employee_role where title = ?", [newRole], function(err, res){
          if (err) throw err
          let roleId = res[0].id
          let name = pickedEmployee.split(" ")
          connection.query("update employee set role_id = ? where first_name = ? and last_name = ?", [roleId, name[0], name[1]], function(err, res){
            if (err) throw err
            console.table(res)
          })
        })
      })
    })
  })
}