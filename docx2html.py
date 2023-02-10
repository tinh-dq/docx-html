import os
import re
import mammoth as mammoth
from glob import glob
from bs4 import BeautifulSoup

def save(texts, file_name):
    with open(file_name, "w", encoding="utf-8") as f:
        f.writelines(texts)


def createFolder(path):
    is_exist = os.path.exists(path)
    if not is_exist:
        # Create a new directory because it does not exist
        os.makedirs(path)
        print("The new directory is created!")


x = glob("D:\\*.docx")
form = """<!DOCTYPE html>
<html lang="en">
<head>
</head>
<body>
    {text}
</body>
</html>"""
for f in x:
    with open(f, "rb") as docx_file:
        result = mammoth.convert_to_html(docx_file)
        text = form.format(text=result.value)
        # soup = BeautifulSoup(text, 'html.parser')
        # bt = soup.prettify()
        save(text, re.sub(r'.docx|.DOCX', ".html", f))
