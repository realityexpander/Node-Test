var mysql = require('mysql');
var dt = require('./DateTime');
var url = require('url');
var fs = require('fs');
var http = require('http');
var qs = require('querystring');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "giraffe"
});


con.connect(function(err) {
  if (err) {
    console.error('Error:- ' + err.stack);
    return;
  }

  http.createServer(function (req, res) {
      console.log(req.url);
      if (req.url == "/json/version" || req.url == "/json" || req.url == '/favicon.ico')
         return;

      var request = url.parse(req.url, true).query;
      var requestDB = request.table;
      var requestPath = url.parse(req.url, true).pathname;

      if (requestPath === "/edit") {
         console.log("edit", req.url);
         console.log(request);
         

//     var id = requestDB + "/" 
//     + fields[0] +":"+ result[i][fields[0]] 
//     + "/" + fields[j]
//     + "/" + requestColumn
//     + "/" + requestItem;
    //http://localhost:8075/edit:{"employee/emp_id:103/last_name/emp_id/%":"Martins1"}
    //http://localhost:8075/edit?table=employee&column=emp_id&employee%2Femp_id%3A103%2Flast_name%2Femp_id%2F%25=Martins1
//     res.write('<form action="/edit" method="GET" target="_self">');
//     res.write('<input type="text" name="'+ id +'" value="' + data + '" required></input>');
//     res.write(`<input type="hidden" id="table" name="table" value="${requestDB}">`);
//     res.write(`<input type="hidden" id="IDColumn" name="IDColumn" value="${fields[0]}">`);
//     res.write(`<input type="hidden" id="IDItem" name="IDColumn" value="${result[i][fields[0]]}">`);
//     res.write(`<input type="hidden" id="editColumn" name="editColumn" value="${fields[j]}">`);
//     res.write(`<input type="hidden" id="newData" name="newData" value="${data}">`);
//     res.write(`<input type="hidden" id="previousColumn" name="previousColumn" value="${requestColumn}">`);
//     res.write(`<input type="hidden" id="previousItem" name="previousItem" value="${requestItem}">`);



//          requestDB     = Object.keys(request)[0].split('/')[0];
         requestDB           = request.table;
//          var requestIDColumn = Object.keys(request)[0].split('/')[1].split(':')[0]; //Column name
         var requestIDColumn = request.IDColumn;
//          var requestIDItem   = Object.keys(request)[0].split('/')[1].split(':')[1]; //Item data
         var requestIDItem   = request.IDItem;
//          var editColumn      = Object.keys(request)[0].split('/')[2]; // column to edit
         var editColumn      = request.editColumn;
//          var newData         = request[Object.keys(request)[0]]; // data to replace
         var newData         = request.newData; // data to replace
//          var requestColumn = Object.keys(request)[0].split('/')[3];
         var requestColumn   = request.previousColumn;  
//          var requestItem     = Object.keys(request)[0].split('/')[4];
         var requestItem     = request.previousItem;
         var query = 'UPDATE ' + requestDB +
                     ' SET '   + editColumn + 
                     ' = "'    + newData + '"' +
                     ' WHERE ' + requestIDColumn + 
                     ' = "'    + requestIDItem + '"';
         con.query(query, function (err, result) {
            console.log(result);
            if(err) {
              res.write(err);
              res.end();
              return;
            }

            viewDatabase(requestPath, requestDB, requestColumn, requestItem);
         });
      }

      // http://localhost:8075/view?database=employee&emp_id=10_
      if ( requestPath === '/view' ) {
        viewDatabase(requestPath, requestDB, request.column, request.item);
     }

     function viewDatabase(requestPath, requestDB, requestColumn, requestItem) {
        //var query = 'SELECT employee.first_name, employee.last_name FROM employee WHERE employee.emp_id IN (SELECT works_with.emp_id FROM works_with WHERE works_with.total_sales > 30000)'
        var query = 'SELECT * FROM '+requestDB+' WHERE '+requestColumn+' LIKE ?';

        // Set the Headers and Head tags
        res.writeHead(200, {'Content-Type': 'text/html'});
        var data = fs.readFileSync('styles.css', 'utf8');
        res.write(data);

        con.query('SHOW TABLES', function (err, result) {

          // Heading
          res.write(`<h1>${requestPath}:${JSON.stringify(request)}</h1>`); 
          res.write('<h3>' + query + '['+requestItem+']</h3><br>'); 

          // Show available databases
          var availableTables = '';
          for(var i in result) {
              availableTables += (result[i][Object.keys(result[i])[0]]) + " / ";
          }
          availableTables = availableTables.slice(0, availableTables.length - 2);

          // Search box
          res.write('<form action="/view" method="GET" target="_self">');
          res.write('Search Table: ' + availableTables + '<br>');
  //         res.write('<input type="text" name="database" value="' + requestDB+ '" required></input><br>');
          res.write(`<input type="text" name="table" value="${requestDB}" required></input><br>`);
          res.write('Search column:<br>');
          res.write('<input type="text" name="column" value="' + requestColumn + '" required></input><br>');
          res.write('Search criteria:<br>');
          res.write('<input type="text" name="item" value="' + requestItem + '" required></input><br>');
          res.write('<input type="submit" value="View"><br>');
          res.write('</form>');
          res.write('</td>');

          res.write(dt.dateTime() + '<br><br>');

          // Table header
          res.write('<table id="t01">');
          res.write('<tbody>');
          res.write('<tr>');

          // Get all the tables in the database
          con.query('DESCRIBE ' + requestDB, [requestItem], function (err, result) {
            for(var i in result) {
              res.write('<th>');
              res.write(result[i].Field);
              res.write('</th>')
            }
            res.write('</tr>');

            // Shoe the records
            // http://localhost:8075/view?database=employee&emp_id=10_
            con.query(query, [requestItem], function (err, result) {
              if (err) {
                res.write('</tbody>');
                res.write('</table>');
                res.write('<br>' + err + '<br>');
              } else {

                for(var i in result) {
        //           res.write("<p>Record: "+ i + "=" + JSON.stringify(result[i]) +"</p><br>");
                    res.write('<tr>');
                    var fields = Object.keys(result[i]);
                    for(var j in fields) {
                      var data = result[i][fields[j]];
                      if (data !== null && data.constructor !== null && data.constructor.name === 'Date')
                        data = data.toLocaleDateString();
                      res.write('<td>');
                      res.write('' + data);

//                       var id = requestDB + "/" 
//                               + fields[0] +":"+ result[i][fields[0]] 
//                               + "/" + fields[j]
//                               + "/" + requestColumn
//                               + "/" + requestItem;
                      //http://localhost:8075/edit:{"employee/emp_id:103/last_name/emp_id/%":"Martins1"}
                      //http://localhost:8075/edit?table=employee&column=emp_id&employee%2Femp_id%3A103%2Flast_name%2Femp_id%2F%25=Martins1
                      res.write('<form action="/edit" method="GET" target="_self">');
//                       res.write('<input type="text" name="'+ id +'" value="' + data + '" required></input>');
                      res.write(`<input type="text" name="newData" value="${data}" required</input>`);
                      res.write(`<input type="hidden" id="table"          name="table"          value="${requestDB}">`);
                      res.write(`<input type="hidden" id="IDColumn"       name="IDColumn"       value="${fields[0]}">`);
                      res.write(`<input type="hidden" id="IDItem"         name="IDItem"         value="${result[i][fields[0]]}">`);
                      res.write(`<input type="hidden" id="editColumn"     name="editColumn"     value="${fields[j]}">`);
                      res.write(`<input type="hidden" id="previousColumn" name="previousColumn" value="${requestColumn}">`);
                      res.write(`<input type="hidden" id="previousItem"   name="previousItem"   value="${requestItem}">`);
                      res.write('<input type="submit" value="Update">');
                      res.write('</form>');
                      res.write('</td>');
                    }
                    res.write('</tr>');
                }
                res.write('</tbody>');
                res.write('</table>');

              }




              res.write('</body>');
              res.write('</html>');
              res.end();
            });
         });
       });
     }

  }).listen(8075);

});



// con.connect(function(err) {
//   if (err) throw err;
//   console.log("Connected!");
//   var id = 101;
//   var id2= 103;
//   con.query('SELECT * FROM employee WHERE emp_id = ? OR emp_id = ?', [id, id2], function (err, result) {
//     if (err) throw err;
//     for(var i in result)
//       console.log("Result: " + stringifyJSON(result[i]));
//   });

//   con.query('SELECT first_name, birth_day from employee;', function (err, result, fields) {
//     if (err) throw err;
//     console.log(fields);
//     // for(var i in result)
//     //   console.log("Result: " + stringifyJSON(result[i]));
//   });
// });


var stringifyJSON = function(obj) {

  var res = '';

  function stringify(obj) {

    // Functions and Undefined not allowed
    if (typeof obj === 'function' || typeof obj === undefined)
      return;

    // Add obj as string
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        res += '"' + obj + '"';
      } else {
        res += String(obj); // convert to obj to string
      }

    } else {


      var removeLastComma = false;


      if (Array.isArray(obj)) {

          // Arrays
          res += '[';

          if(obj.length > 0) {
              for (var i of obj) {
                  if (typeof i !== "undefined" && typeof i !== 'function') {
                      stringify(i);
                      res += ', ';
                      removeLastComma = true;
                  }
              }
              if(removeLastComma)
                  res = res.slice(0, res.length - 2);
          }
          res += ']';
       } else {

          // Objects
          res += '{';

          if(Object.keys(obj).length > 0) {
              for (var i in obj) {
                  if (typeof obj[i] !== "undefined" && typeof obj[i]!=='function') {
                      res += '"' + i + '": ';
                      stringify(obj[i]); // recursion here
                              res += ', ';
                      removeLastComma = true;
                  }
              }
              if (removeLastComma)
                  res = res.slice(0, res.length - 2);
          }
          res += '}';
       }
    }
  }

  stringify(obj);

  return res;
};



//       res.write('<style>');
//       res.write('h1 {');
//       res.write('    color: blue;');
//       res.write('    font-family: verdana;');
//       res.write('    font-size: 300%;');
//       res.write('}');
//       res.write('p  {');
//       res.write('    color: red;');
//       res.write('    font-family: courier;');
//       res.write('    font-size: 100%;');
//       res.write('}');
//       res.write('</style>');
//       res.write('</head>');
//       res.write('<body>');