xcopy /y /i "xvExporter.addin" "%ALLUSERSPROFILE%\Autodesk\Revit\Addins\2017\"
xcopy /y /i "assets\*.*" "%ALLUSERSPROFILE%\Autodesk\Revit\Addins\2017\xvExporter\assets\"
xcopy /y /i "bin\Debug\gl*" "%ALLUSERSPROFILE%\Autodesk\Revit\Addins\2017\xvExporter"
xcopy /y /i "bin\Debug\an*" "%ALLUSERSPROFILE%\Autodesk\Revit\Addins\2017\xvExporter"
xcopy /y /i "..\..\csharp\anclient\anclient.net\bin\Debug\Antlr4*" "%ALLUSERSPROFILE%\Autodesk\Revit\Addins\2017\xvExporter"
xcopy /y /i "bin\Debug\Newtonsoft*" "%ALLUSERSPROFILE%\Autodesk\Revit\Addins\2017\xvExporter"