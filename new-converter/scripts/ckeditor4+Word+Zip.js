let zip,
  htmlZip,
  cnt = 0,
  isMultiFile = false,
  isDebugOn = false,
  isParseDone = false,
  inputText = "";
CKEDITOR.replace("inputText", {
  removeButtons: "PasteFromWord",
  toolbar: [
    {
      name: "clipboard",
      items: ["PasteFromWord", "-", "Undo", "Redo"],
    },
    {
      name: "basicstyles",
      items: [
        "Bold",
        "Italic",
        "Underline",
        "Strike",
        "RemoveFormat",
        "Subscript",
        "Superscript",
      ],
    },
    {
      name: "links",
      items: ["Link", "Unlink"],
    },
    {
      name: "paragraph",
      items: [
        "NumberedList",
        "BulletedList",
        "-",
        "Outdent",
        "Indent",
        "-",
        "Blockquote",
      ],
    },
    {
      name: "insert",
      items: ["Image", "Table"],
    },
    {
      name: "editing",
      items: ["Scayt"],
    },
    {
      name: "styles",
      items: ["Format", "Font", "FontSize"],
    },
    {
      name: "colors",
      items: ["TextColor", "BGColor", "CopyFormatting"],
    },
    {
      name: "align",
      items: ["JustifyLeft", "JustifyCenter", "JustifyRight", "JustifyBlock"],
    },
    {
      name: "document",
      items: ["Source"],
    },
  ],
  // Enabling extra plugins, available in the full-all preset: https://ckeditor.com/cke4/presets
  extraPlugins: "colorbutton,font,justify,tableresize,pastefromword,liststyle",
}).on("change", function (e) {
  document.getElementById("exampleTextarea").value = e.editor.getData();
  inputText = modifyHtml(e.editor.getData());
  displayResult(inputText);
});

function saveTextToFile() {
  var fName = document.getElementById("fileName").value.trim();
  fName = fName.length > 0 ? fName : "Out.html";
  if (inputText != "") saveToFile(inputText, fName);
}

// Process 'file' input box
function readFiles(event) {
  event.preventDefault();
  var renameOption = getRenameOption();
  if (renameOption == "by_script") {
    var rename_script = document.getElementById("rename_script").value;
    isParseDone = parseScript(rename_script);
    if (!isParseDone) {
      return;
    }
  }

  var fileList = event.target.files || event.dataTransfer.files;
  isDebugOn = document.getElementById("debug").checked;
  isMultiFile = fileList.length > 1;
  zip = new JSZip();
  htmlZip = zip.folder("html");
  cnt = fileList.length;

  for (var i = 0; i < fileList.length; i++) {
    console.log("Processing: ", fileList[i].name);
    if (fileList[i].name.toLowerCase().includes(".docx"))
      loadAsMSWord(fileList[i]);
    else if (fileList[i].name.toLowerCase().includes(".html"))
      loadAsText(fileList[i]);
    else alert("Wrong format, accept '.docx' & '.html' files only");
  }
}
var wordFileName = "out.html";
var options = {
  styleMap: ["u => u"],
};

// Read Microsoft Word files content, edit and save file
function loadAsMSWord(wordFile) {
  var reader = new FileReader();

  reader.onload = function (loadedEvent) {
    var arrayBuffer = loadedEvent.target.result;

    // read, edit and save file
    mammoth
      .convertToHtml({ arrayBuffer: arrayBuffer }, options)
      .then(function (result) {
        var htmlCode = modifyHtml(result.value);
        displayResult(htmlCode);
        var fileName = getOutputName(wordFile.name);
        console.log(fileName);
        if (!fileName) return;
        if (!isDebugOn) saveToFile(htmlCode, fileName);
      })
      .done();
  };

  reader.readAsArrayBuffer(wordFile);
}

function displayResult(htmlCode) {
  // display the result only one time
  if (!isMultiFile || cnt == 1)
    document.getElementById("exampleTextarea").value = htmlCode;
}

// Read files content
function loadAsText(theFile) {
  var reader = new FileReader();

  reader.onload = function (loadedEvent) {
    var htmlCode = modifyHtml(loadedEvent.target.result);
    displayResult(htmlCode);
    var fileName = getOutputName(theFile.name);
    console.log(fileName);
    if (!fileName) return;
    if (!isDebugOn) saveToFile(htmlCode, fileName);
  };
  reader.readAsText(theFile);
}

var table_style = `<style>table,td{border:0.5px solid black;border-collapse:collapse;vertical-align:top;}td:first-child{text-align:center;vertical-align:middle;}</style>`;

String.prototype.fillTemplate = function (params) {
  var tmp = this;
  var keys = Object.keys(params);
  for (var i = 0; i < keys.length; i++)
    tmp = tmp.replace("${" + keys[i] + "}", params[keys[i]]);
  return tmp;
};

String.prototype.turning = function () {
  return (
    this
      // unordered list (optional)
      .replace(/ul>/g, "div>")
      .replace(/<li[^>]*>([A-Z])/g, "<p>• $1")
      .replace(/li>/g, "p>")
      // remove office tags
      .replace(/<\/?o[^>]*>/g, "")
      //remove tabs
      .replace(/&nbsp;|[\t\r\n]+/gi, " ")
      // remove inline styles
      .replace(/ style="((?!(center|right|light-through|underline|")).)*"/g, "")
      .replace(/<span>((?!(<\/span>)).)*<\/span>/g, "$1")
      // open new tab instead
      .replace(/<a href/g, "<a target=_blank href")
      .replace(/<br\s\/>/g, "<br>")
      // remove multi space
      .replace(/\s\s+/g, " ")
      .replace(/ (<p>|<br>|<\/p>)/g, "$1")
      // replace - by \u2013
      .replace(/(<br>|<\/p>|<p>)-/g, "$1\u2013")
      // remove empty rows
      .replace(/<tr>(<td><\/td>)+<\/tr>/g, "")
      // remove table style
      .replace(/<table [^>]*>/g, "<table>")
      //remove span not has style
      .replace(/<span>((?!(<\/span>)).)*<\/span>/g, "$1")
  );
};

function modifyHtml(htmlCode) {
  var text_obj = {};
  text_obj["table_style"] = htmlCode.includes("<table") ? table_style : "";
  text_obj["body"] = htmlCode.turning();
  return document.getElementById("templateTxt").value.fillTemplate(text_obj);
}

function saveToFile(htmlCode, fileName) {
  if (!isMultiFile && typeof fileName === "string") {
    var textFileAsBlob = new Blob([htmlCode], { type: "text/plain" });
    saveAs(textFileAsBlob, fileName);
  } else {
    if (typeof fileName === "string") {
      htmlZip.file(fileName, htmlCode);
    } else {
      for (var i = 0; i < fileName.length; i++) {
        console.log(fileName[i]);
        var name = fileName[i];
        htmlZip.file(name, htmlCode);
      }
    }
    cnt--;
    if (!cnt) {
      isMultiFile = false;
      zip.generateAsync({ type: "blob" }).then(function (content) {
        saveAs(content, "html.zip");
      });
    }
  }
}
