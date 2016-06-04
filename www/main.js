var express = require("express");
var bodyParser = require("body-parser");
var morgan = require("morgan");

var app = express();
app.use(bodyParser.urlencoded({ extended:true }));
app.use(bodyParser.json());
app.use(morgan("dev"));

app.get("*", function(req, res){
  res.sendFile(__dirname + "/index.html")
})
app.listen(config.port, function(err){
  if(err){
    console.log("Error in loading express");
  }else{
    console.log("Listening to port 3000");
  }
});
