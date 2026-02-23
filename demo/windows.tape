Output windows.gif

Set FontSize 14
Set Width 920
Set Height 620
Set Theme "Dracula"
Set Padding 10
Set TypingSpeed 60ms
Set PlaybackSpeed 1

# Windows ドライブ上から実行できることを示す
Type "cd /mnt/c/Users/Swimm"
Enter
Sleep 500ms

Type "echo-news --source currents --limit 3"
Enter
Sleep 5s

Type "echo-news --topic AI --limit 3 --url"
Enter
Sleep 5s

Type "echo-news --quota"
Enter
Sleep 1500ms
