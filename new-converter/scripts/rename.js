var renameOption = "none";
function getRenameOption() {
  var select = document.getElementById("rename_option");
  return select.options[select.selectedIndex].value;
}

function getOutputName(fileName) {
  switch (renameOption) {
    case "by_regex":
      return getOutputNameByRegex(fileName);
    case "by_script":
      return getOutputNameByScript(fileName);
    default:
      return fileName.substring(0, fileName.lastIndexOf(".")) + ".html";
  }
}

function getOutputNameByScript(fileName) {
  return runScript(fileName);
}

function getOutputNameByRegex(fileName) {
  var regInput = document.getElementById("rename_regex").value;
  var regReplace = document.getElementById("rename_regex_replace").value;
  var regex = new RegExp(regInput);
  return fileName.replace(regex, regReplace);
}
