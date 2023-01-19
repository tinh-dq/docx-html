var script_data = [];
function parseScript(script) {
  script_data = [];
  var lines = script.replace("\r\n", "\n").split("\n");
  for (var i = 0; i < lines.length; i++) {
    lines[i] = lines[i].trim();
    if (lines[i] == "") continue;
    var function_name = lines[i].substring(0, lines[i].indexOf("(")).toLowerCase().trim();
    var body = lines[i].substring(lines[i].indexOf("(") + 1, lines[i].lastIndexOf(")"));

    var args = body.split(",");
    switch (function_name) {
      case "insert":
        if (args.length != 2) {
          alert('"' + function_name + '" needs two arguments');
          return false;
        }
        break;
      case "replace":
        if (args.length % 2 != 0) {
          alert('"' + function_name + '" needs an even number of arguments: 2, 4, 6,...');
          return false;
        }
        break;
      case "delete":
        if (args.length != 2) {
          alert('"' + function_name + '" needs two arguments');
          return false;
        }
        break;
    }
    script_data.push({ function_name: function_name, args: args });
  }
  return true;
}
function runScript(text) {
  var output = text;
  for (var i = 0; i < script_data.length; i++) {
    switch (script_data[i].function_name) {
      case "insert":
        var start = parseInt(script_data[i].args[1]);
        if (start < 0) start = output.length + start + 1;
        output =
          output.substring(0, start) +
          script_data[i].args[0] +
          output.substring(start, output.length);
        break;
      case "replace":
        for (var j = 0; j < script_data[i].args.length; j += 2) {
          output = output.replace(script_data[i].args[j], script_data[i].args[j + 1]);
        }
        break;
      case "delete":
        var arg0 = parseInt(script_data[i].args[0]);
        if (arg0 < 0) arg0 = output.length + arg0;
        var arg1 = parseInt(script_data[i].args[1]);
        if (arg1 < 0) arg1 = output.length + arg1;
        if (arg0 > arg1) {
          var tmp = arg0;
          arg0 = arg1;
          arg1 = tmp;
        }
        output = output.substring(0, arg0) + output.substring(arg1 + 1, output.length);
        break;
      case "remove":
        for (var j = 0; j < script_data[i].args.length; j ++) {
          output = output.replace(script_data[i].args[j], "");
        }
        break;
    }
  }
  return output;
}
