var mysql = require('mysql');
var dt = require('./DateTime');
var url = require('url');
var fs = require('fs');
var http = require('http');
var {parse} = require('querystring');

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

  http.createServer(function(req, res) {
    console.log(req.url);
    if (req.url == "/json/version" || req.url == "/json" || req.url == '/favicon.ico')
      return;

    var request = url.parse(req.url, true).query;
    var requestPath = url.parse(req.url, true).pathname;

    // Route: Default path
    if (requestPath === '/') {
      request.table = 'employee';
      request.column = 'emp_id';
      request.item = '%';
      viewDatabase(requestPath, request); //.table, request.column, request.item);
    }

    // Route: Edit an Element
    if (requestPath === "/edit") {
      if (req.method === 'POST') {
        collectRequestData(req, request => {
          console.log(request);
          //res.write(`Parsed data belonging to ${JSON.stringify(request)}`);

          var query = 'UPDATE ' + request.table 
                    + ' SET '   + request.editColumn 
                    + ' = "'    + request.newData + '"' 
                    + ' WHERE ' + request.IDColumn 
                    + ' = "'    + request.IDItem + '"';
          con.query(query, function(err, result) {
            console.log(result);
            if (err) {
              res.write(err);
              res.end();
              return;
            } else {
              viewDatabase(requestPath, request); //.table, request.previousColumn, request.previousItem);
            }
          });
        });
      } else { // show default data, if user attempts a refresh on Edit
        request.table = 'employee';
        request.column = 'emp_id';
        request.item = '%';
        viewDatabase(requestPath, request); //.table, request.column, request.item);
      }

    }

    // Route: View table
    // http://localhost:8075/view?database=employee&emp_id=10_
    if (requestPath === '/view') {
      viewDatabase(requestPath, request); //.table, request.column, request.item);
    }

    function viewDatabase(requestPath, request) { //request.table, requestColumn, requestItem) {
      //var query = 'SELECT employee.first_name, employee.last_name FROM employee WHERE employee.emp_id IN (SELECT works_with.emp_id FROM works_with WHERE works_with.total_sales > 30000)'
      var query = 'SELECT * FROM ' + request.table + ' WHERE ' + request.column + ' LIKE ?';

      // Set the Headers and Head tags for css
      res.writeHead(200, {
        'Content-Type': 'text/html'
      });
      var data = fs.readFileSync('styles.css', 'utf8');
      res.write(data);

      con.query('SHOW TABLES', function(err, result) {
        // Get the tables for this database
        // Heading
        res.write(`<h1>${requestPath}:${JSON.stringify(request)}</h1>`);
        res.write(`<h3>${query}[${request.item}]</h3>`);

        // Show available tables
        var availableTables = '';
        for (var i in result) {
          availableTables += (result[i][Object.keys(result[i])[0]]) + " / ";
        }
        availableTables = availableTables.slice(0, availableTables.length - 2);

        // Search box
        res.write('<form action="/view" method="GET" target="_self">');
        res.write(`<b>${availableTables}</b><br>`);
        res.write('Search Table: ');
        res.write(`<input type="text" name="table"  value="${request.table}"  required></input><br>`);
        res.write('Search column: ');
        res.write(`<input type="text" name="column" value="${request.column}" required></input><br>`);
        res.write('Search criteria: ');
        res.write(`<input type="text" name="item"   value="${request.item}"   required></input><br>`);
        res.write('<input type="submit" value="View"><br>');
        res.write('</form>');
        res.write('</td>');

        //res.write(dt.dateTime() + '<br><br>');
        res.write('<br>');

        // Table header
        res.write('<table id="t01">');
        res.write('<tbody>');
        res.write('<tr>');

        // Get all the columns in the database
        con.query('DESCRIBE ' + request.table, [request.item], function(err, result) {
          for (var i in result) {
            res.write('<th>');
            res.write(result[i].Field);
            res.write('</th>')
          }
          res.write('</tr>');

          // Show the rows
          // http://localhost:8075/view?database=employee&emp_id=10_
          con.query(query, [request.item], function(err, result) {
            if (err) {
              res.write('</tbody>');
              res.write('</table>');
              res.write('<br>' + err + '<br>');
            } else {

              // Show data and edit table UI
              for (var i in result) {
                // res.write("<p>Record: "+ i + "=" + JSON.stringify(result[i]) +"</p><br>");
                res.write('<tr>');
                var fields = Object.keys(result[i]);
                for (var j in fields) {
                  var data = result[i][fields[j]];

                  // Change Date format back to mySQL format
                  if (data !== null && data.constructor !== null && data.constructor.name === 'Date')
                    data = data.toLocaleDateString();

                  res.write('<td>');
                  res.write('' + data);
                  //http://localhost:8075/edit?newData=David&table=employee&IDColumn=emp_id&IDItem=100&editColumn=first_name&previousColumn=emp_id&previousItem=%25
                  res.write('<form action="/edit" method="POST" target="_self">');
                  res.write(`<input type="text"                       name="newData"        value="${data}" required</input>`);
                  res.write(`<input type="hidden" id="table"          name="table"          value="${request.table}">`);
                  res.write(`<input type="hidden" id="IDColumn"       name="IDColumn"       value="${fields[0]}">`);
                  res.write(`<input type="hidden" id="IDItem"         name="IDItem"         value="${result[i][fields[0]]}">`);
                  res.write(`<input type="hidden" id="editColumn"     name="editColumn"     value="${fields[j]}">`);
                  res.write(`<input type="hidden" id="previousColumn" name="previousColumn" value="${request.column}">`);
                  res.write(`<input type="hidden" id="previousItem"   name="previousItem"   value="${request.item}">`);
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

function collectRequestData(request, callback) {
  const FORM_URLENCODED = 'application/x-www-form-urlencoded';
  if (request.headers['content-type'] === FORM_URLENCODED) {
    let body = '';
    request.on('data', chunk=>{
      body += chunk.toString();
    }
    );
    request.on('end', ()=>{
      callback(parse(body));
    }
    );
  } else {
    callback(null);
  }
}

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
        res += String(obj);
        // convert to obj to string
      }

    } else {

      var removeLastComma = false;

      if (Array.isArray(obj)) {

        // Arrays
        res += '[';

        if (obj.length > 0) {
          for (var i of obj) {
            if (typeof i !== "undefined" && typeof i !== 'function') {
              stringify(i);
              res += ', ';
              removeLastComma = true;
            }
          }
          if (removeLastComma)
            res = res.slice(0, res.length - 2);
        }
        res += ']';
      } else {

        // Objects
        res += '{';

        if (Object.keys(obj).length > 0) {
          for (var i in obj) {
            if (typeof obj[i] !== "undefined" && typeof obj[i] !== 'function') {
              res += '"' + i + '": ';
              stringify(obj[i]);
              // recursion here
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
