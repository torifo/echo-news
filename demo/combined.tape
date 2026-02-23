Output combined.gif

Set FontSize 14
Set Width 920
Set Height 660
Set Theme "Dracula"
Set Padding 10
Set TypingSpeed 60ms
Set PlaybackSpeed 1

# ── Windows ドライブから実行 ──────────────────
Type "cd /mnt/c/Users/Swimm"
Enter
Sleep 400ms

Type "echo-news --source currents --limit 3"
Enter
Sleep 5s

# ── WSL ホームに移動して全機能デモ ────────────
Type "cd ~"
Enter
Sleep 300ms

Type "echo-news --topic AI --limit 3 --url"
Enter
Sleep 5s

Type "echo-news config show"
Enter
Sleep 2s

Type "echo-news --quota"
Enter
Sleep 1500ms
