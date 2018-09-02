var mysql = require('mysql');
var dt = require('./DateTime');
var url = require('url');
var fs = require('fs');
var http = require('http');

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
      var requestDB = request.database;
      var requestColumn = Object.keys(request)[1];
      var requestItem = request[Object.keys(request)[1]];

      //var query = 'SELECT employee.first_name, employee.last_name FROM employee WHERE employee.emp_id IN (SELECT works_with.emp_id FROM works_with WHERE works_with.total_sales > 30000)'
      var query = 'SELECT * FROM '+requestDB+' WHERE '+requestColumn+' LIKE ?';

      res.writeHead(200, {'Content-Type': 'text/html'});
      var data = fs.readFileSync('styles.css', 'utf8');
      res.write(data);

      // Heading
      res.write('<h1>' + JSON.stringify(request) + '</h1>'); 
      res.write('<h3>' + query + '['+requestItem+']</h3><br>'); 
//       res.write('<h1>'+requestColumn +'='+ requestItem + '</h1><br>');
      res.write(dt.dateTime() + '<br><br>');

      // Table header
      res.write('<table id="t01">');
      res.write('<tbody>');
      res.write('<tr>');

      con.query('DESCRIBE '+requestDB, [requestItem], function (err, result) {

        for(var i in result) {
          res.write('<th>');
          res.write(result[i].Field);
          res.write('</th>')
        }
        res.write('</tr>');

        // http://localhost:8075/?database=employee&emp_id=10_
        con.query(query, [requestItem], function (err, result) {

          for(var i in result) {
  //           res.write("<p>Record: "+ i + "=" + JSON.stringify(result[i]) +"</p><br>");
              res.write('<tr>');
              var fields = Object.keys(result[i]);
              for(var j in fields) {
                res.write('<td>');
                res.write(''+result[i][fields[j]]);
                res.write('<input type="text" value="' + result[i][fields[j]] + '"></input>');
                res.write('<button>' + i + "_"+ fields[j] +'</button>');
                res.write('</td>');
              }
              res.write('</tr>');
          }
          res.write('</tbody>');
          res.write('</table>');


          res.write('</body>');
          res.write('</html>');
          res.end();
        });
     });

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