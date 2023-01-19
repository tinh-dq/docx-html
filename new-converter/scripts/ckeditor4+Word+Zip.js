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
    "/",
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
  console.log("Processing...");
  document.getElementById("exampleTextarea").value = e.editor.getData();
  var fName = document.getElementById("fileName").value.trim();
  fName = fName.length > 0 ? fName : "Out.html";
  var htmlCode = parseDoms(e.editor.getData());
  displayResult(htmlCode);
  if (!isDebugOn) saveToFile(htmlCode, fName);
});

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}
let zip,
  htmlZip,
  cnt = 0,
  isMultiFile = false,
  isDebugOn = false,
  isParseDone = false;
// Process 'file' input box
function readFiles(event) {
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
    if (fileList[i].name.includes(".docx")) loadAsMSWord(fileList[i]);
    else if (fileList[i].name.includes(".html")) loadAsText(fileList[i]);
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
        var htmlCode = parseDoms(result.value);
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
String.prototype.interpolate = function (params) {
  const names = Object.keys(params);
  const vals = Object.values(params);
  return new Function(...names, `return \`${this}\`;`)(...vals);
};
function displayResult(htmlCode) {
  // display the result only one time
  if (!isMultiFile || cnt == 1)
    document.getElementById("exampleTextarea").value = htmlCode;
}

// Read files content
function loadAsText(theFile) {
  var reader = new FileReader();

  reader.onload = function (loadedEvent) {
    var htmlCode = parseDoms(loadedEvent.target.result);
    displayResult(htmlCode);
    var fileName = getOutputName(theFile.name);
    console.log(fileName);
    if (!fileName) return;
    if (!isDebugOn) saveToFile(htmlCode, fileName);
  };
  reader.readAsText(theFile);
}

// Main process: Parse input html file and fill to template
function turning1(htmlCode) {
  return htmlCode
    .replace(/ul>/g, "div>")
    .replace(/<li[^>]*>([A-Z])/g, "<p>• $1")
    .replace(/li>/g, "p>")
    .replace(/<br \/>/g, "new_line_br");
}

function turning2(htmlCode) {
  return htmlCode
    .replace(/<\/?span[^>]*>/g, "")
    .replace(/<\/?o[^>]*>/g, "")
    .replace(' style="mso-bidi-font-weight: normal"', "")
    .replace("<a href", "<a target=_blank href");
}

function turning3(htmlCode) {
  return htmlCode
    .replace(/&nbsp;|[\r\n]+/gi, " ")
    .replace("§ ", "• ")
    .trim()
    .replace(/new_line_br/g, "<br>")
    .replace(/＞/g, ">");
}

var table_style = `
    <style>
      table, td {
        border: 0.5px solid black;
        border-collapse: collapse;
        vertical-align: top;
      }
      td:first-child {
        text-align: center;
        vertical-align: middle;
      }
    </style>`;

function parseDoms(htmlCode) {
  var counter = 0,
    text_obj = {},
    currentText,
    el,
    bTag,
    doc = document.createElement("div"),
    isDebugOn = false;
  text_obj["table_style"] = htmlCode.includes("<table>") ? table_style : "";
  text_obj["specialText1"] = htmlCode.includes("rtl")
    ? ' dir="rtl"'
    : ' dir="auto"';
  if (document.getElementById("debug"))
    isDebugOn = document.getElementById("debug").checked;

  doc.innerhtmlCode = turning1(htmlCode);
  var pTags = doc.getElementsByTagName("p");
  if (pTags.length < 1) {
    doc.innerHTML = turning1(htmlCode);
    pTags = doc.getElementsByTagName("p");
  }

  for (var i = 0; i < pTags.length; ++i) {
    pTags[i].innerHTML = pTags[i].innerHTML.replace("① <strong>", "<strong>");
    currentText = pTags[i].innerText.trim();
    if (pTags[i].innerText.trim().length) {
      counter++;
      el = pTags[i];
      bTag = el.getElementsByTagName("b");

      if (
        el.innerHTML.includes("<a") ||
        (bTag.length && !bTag[0].innerHTML.includes("<span"))
      ) {
        if (bTag.length && !bTag[0].innerText.trim())
          el.getElementsByTagName("span")[0].removeChild(bTag[0]);
        currentText = turning2(el.innerHTML);
      } else if ("·" == currentText.charAt(0)) {
        currentText = currentText.replace(/ /g, "");

        if (" " != currentText.charAt(1))
          currentText = currentText.replace("·", "• ");
        else currentText = currentText.replace("·", "•");
      }
      text_obj["Text" + counter] =
        (isDebugOn ? "Text" + counter + ":" : "") + turning3(currentText);
      if (isDebugOn) console.log(text_obj["Text" + counter]);
    }
  }
  text_obj["body"] = htmlCode;

  return document.getElementById("templateTxt").value.interpolate(text_obj);
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
